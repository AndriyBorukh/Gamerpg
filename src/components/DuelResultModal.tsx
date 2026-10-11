import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, OpponentData, TavernData, SettlementData } from '../types';
import { Trophy, Award, Coins, Shield, Crown, RefreshCw, ArrowLeft, Beer, Sparkles, Frown, Zap, Scissors, X } from 'lucide-react';

interface DuelResultModalProps {
    isVictory: boolean;
    opponent: OpponentData;
    tavern: TavernData;
    settlement: SettlementData;
    isTavernNowConquered?: boolean;
    unlockedNextName?: string;
    xpEarned?: number;
    didLevelUp?: boolean;
    newLevel?: number;
    pointsGained?: number;
    winsAgainstOpponent?: number;
    becameNpc?: boolean;
    cardsGained?: Card[];
    cardPiecesGained?: number;
    blankCardsGained?: number;
    discardCountProcessed?: number;
    earnedShopToken?: boolean;
    onRematch: () => void;
    onReturnToTavern: () => void;
    onReturnToMap: () => void;
    onOpenCharacterModal?: () => void;
}

export function DuelResultModal({
    isVictory,
    opponent,
    tavern,
    settlement,
    isTavernNowConquered,
    unlockedNextName,
    xpEarned,
    didLevelUp,
    newLevel,
    pointsGained,
    winsAgainstOpponent,
    becameNpc,
    cardsGained,
    cardPiecesGained,
    blankCardsGained,
    discardCountProcessed,
    earnedShopToken,
    onRematch,
    onReturnToTavern,
    onReturnToMap,
    onOpenCharacterModal
}: DuelResultModalProps) {
    const isRetiredToNpc = Boolean(becameNpc || (winsAgainstOpponent && winsAgainstOpponent >= 3));
    const currentWins = winsAgainstOpponent ?? (isVictory ? 1 : 0);

    // Allow closing with Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onReturnToTavern();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onReturnToTavern]);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onReturnToTavern();
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`relative w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-3xl border-2 shadow-2xl text-center text-[#f5ebd7] flex flex-col items-center gap-3.5 scrollbar-thin scrollbar-thumb-amber-600/50 scrollbar-track-black/40 ${
                    isVictory
                        ? 'bg-gradient-to-b from-[#241c13] via-[#1a140f] to-[#120e0b] border-yellow-500/80 shadow-[0_0_30px_rgba(234,179,8,0.25)]'
                        : 'bg-gradient-to-b from-[#221616] via-[#191111] to-[#120c0c] border-rose-800/80 shadow-[0_0_30px_rgba(225,29,72,0.2)]'
                }`}
            >
                {/* Top-Right Close Button */}
                <button
                    onClick={onReturnToTavern}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 border border-[#b8860b]/40 hover:border-amber-400 text-stone-300 hover:text-white flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                    title="Закрити вікно та повернутися до таверни (Esc)"
                    aria-label="Закрити"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Result Icon */}
                {isVictory ? (
                    <div className="relative mt-1">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                            {isTavernNowConquered ? (
                                <Crown className="w-8 h-8 text-yellow-950" />
                            ) : (
                                <Trophy className="w-8 h-8 text-yellow-950" />
                            )}
                        </div>
                        <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1 animate-spin-slow" />
                    </div>
                ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-stone-900 border-2 border-rose-600 flex items-center justify-center shadow-lg text-rose-400 mt-1">
                        <Frown className="w-8 h-8" />
                    </div>
                )}

                {/* Title and Outcome */}
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-wide">
                        {isVictory ? (
                            <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                                СЛАВЕТНА ПЕРЕМОГА! ⚔️
                            </span>
                        ) : (
                            <span className="text-rose-400">
                                ПОРАЗКА В ПОЄДИНКУ
                            </span>
                        )}
                    </h2>
                    <p className="text-sm text-[#c4b5a0] mt-1">
                        {tavern.name} ({settlement.name})
                    </p>
                </div>

                {/* Opponent Info Card */}
                <div className="w-full bg-[#15100c] p-3.5 rounded-xl border border-stone-800 flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-xl bg-[#221a14] border border-[#b8860b]/40">
                            {opponent.avatar}
                        </span>
                        <div>
                            <div className="text-[11px] text-amber-300 font-bold">
                                {opponent.title}
                            </div>
                            <div className="text-sm font-black text-[#f5ebd7] font-serif">
                                {opponent.name}
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-right flex flex-col items-end gap-1">
                        <span className={isVictory ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {isVictory ? 'Здолано ✓' : 'Виграв партію'}
                        </span>
                        {typeof winsAgainstOpponent === 'number' && (
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                                <span>Рахунок перемог: {winsAgainstOpponent}/3</span>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3].map(step => (
                                        <span 
                                            key={step} 
                                            className={`text-xs ${step <= winsAgainstOpponent ? 'text-yellow-400' : 'text-stone-600'}`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Victory Rewards & Unlocks */}
                {isVictory && (
                    <div className="w-full space-y-2.5">
                        {/* 3-Victory NPC Retirement Milestone */}
                        {isRetiredToNpc && (
                            <div className="p-3 bg-gradient-to-r from-amber-600/40 via-yellow-500/30 to-amber-600/40 border-2 border-yellow-400 rounded-xl text-yellow-200 text-xs font-bold flex flex-col items-center gap-1 shadow-lg animate-pulse">
                                <div className="flex items-center gap-1.5 text-yellow-300 font-black">
                                    <Beer className="w-4 h-4 text-amber-400" />
                                    <span>3-тя ПЕРЕМОГА! СУПРОТИВНИК СТАВ ЗВИЧАЙНИМ НПЦ! 🍺</span>
                                </div>
                                <p className="text-[11px] text-[#f5ebd7]/95 text-center font-normal">
                                    {opponent.name} зазнав(ла) 3 поразок, зняв(ла) колоду та залишив(ла) список гравців. Тепер це мирний гість таверни біля каміна!
                                </p>
                            </div>
                        )}

                        {/* Rewards */}
                        <div className="grid grid-cols-3 gap-2 bg-[#1b150f] p-3 rounded-xl border border-amber-500/40">
                            <div className="flex items-center justify-center gap-1.5 text-amber-300">
                                <Coins className="w-4 h-4 text-amber-400" />
                                <div className="text-left">
                                    <div className="text-[10px] text-[#a89988]">Золото</div>
                                    <div className="font-black text-xs">+{opponent.rewards.gold}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-1.5 text-amber-200">
                                <Shield className="w-4 h-4 text-yellow-400" />
                                <div className="text-left">
                                    <div className="text-[10px] text-[#a89988]">Слава</div>
                                    <div className="font-black text-xs">+{opponent.rewards.reputation}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-1.5 text-emerald-300">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <div className="text-left">
                                    <div className="text-[10px] text-[#a89988]">Досвід</div>
                                    <div className="font-black text-xs">+{xpEarned || opponent.rewards.xp || 100} XP</div>
                                </div>
                            </div>
                        </div>

                        {/* Level Up banner */}
                        {didLevelUp && (
                            <div className="p-3 bg-gradient-to-r from-amber-600/30 via-yellow-500/30 to-amber-600/30 border border-yellow-400 rounded-xl text-yellow-300 text-xs font-black flex items-center justify-center gap-2 animate-pulse">
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                <span>НОВИЙ РІВЕНЬ ДОСЯГНУТО! Рівень {newLevel}! (+{pointsGained} очок прокачки)</span>
                            </div>
                        )}

                        {/* Special tavern conquest callout */}
                        {isTavernNowConquered && (
                            <div className="p-3 bg-gradient-to-r from-yellow-500/20 via-amber-500/30 to-yellow-500/20 border-2 border-yellow-400 rounded-xl text-xs font-black text-yellow-300 animate-pulse">
                                👑 ВІТАЄМО! Ви перемогли 1-ше місце та повністю підкорили таверну «{tavern.name}»!
                            </div>
                        )}

                        {/* First Victory RPG Spell Shop Refresh Token Reward */}
                        {earnedShopToken && (
                            <div className="p-3 bg-gradient-to-r from-purple-950/80 via-indigo-900/60 to-purple-950/80 border-2 border-purple-400 rounded-xl text-xs font-bold text-purple-200 flex flex-col items-center gap-1 shadow-lg animate-pulse">
                                <div className="flex items-center gap-1.5 text-purple-300 font-black">
                                    <span>🎟️ НАГОРОДА ЗА ПЕРШУ ПЕРЕМОГУ!</span>
                                </div>
                                <p className="text-[11px] text-purple-100/95 text-center font-normal">
                                    Отримано <strong>+1 Токен оновлення магазину заклять</strong>! Використовуйте його у магазині для відновлення повного асортименту карт супротивника.
                                </p>
                            </div>
                        )}

                        {/* Next Unlocked Opponent */}
                        {unlockedNextName && (
                            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Новий суперник: <strong>{unlockedNextName}</strong>!</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Defeat Advice & XP */}
                {!isVictory && (
                    <div className="space-y-2 w-full">
                        <div className="p-3 bg-stone-900/90 border border-stone-800 rounded-xl text-xs text-[#c4b5a0] text-left">
                            💡 <strong>Порада шинкаря:</strong> Притримуйте козирі та очки сили до кінця раунду, щоб змусити суперника набрати стіл карт!
                        </div>
                        {typeof xpEarned === 'number' && (
                            <div className="p-2.5 bg-[#1b150f] rounded-xl border border-stone-800 text-xs text-emerald-300 flex items-center justify-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <span>Отримано досвіду за поєдинок: <strong>+{xpEarned} XP</strong></span>
                            </div>
                        )}
                        {didLevelUp && (
                            <div className="p-3 bg-gradient-to-r from-amber-600/30 via-yellow-500/30 to-amber-600/30 border border-yellow-400 rounded-xl text-yellow-300 text-xs font-black flex items-center justify-center gap-2 animate-pulse">
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                <span>НОВИЙ РІВЕНЬ ДОСЯГНУТО! Рівень {newLevel}! (+{pointsGained} очок прокачки)</span>
                            </div>
                        )}
                    </div>
                )}

                {/* RPG Card Rewards */}
                {((cardsGained && cardsGained.length > 0) || (cardPiecesGained && cardPiecesGained > 0) || (blankCardsGained && blankCardsGained > 0) || (discardCountProcessed && discardCountProcessed > 0)) ? (
                    <div className="w-full p-4 bg-[#130d0a] border border-[#b8860b]/30 rounded-2xl text-left space-y-3 shadow-inner">
                        <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                            <span>Нагороди та переробка відбою</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {blankCardsGained && blankCardsGained > 0 ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950/50 border border-amber-500/40 rounded-xl text-xs text-amber-200 font-bold">
                                    <span>📄</span>
                                    <span>+{blankCardsGained} пустих карт (об'єднано з відбою 4 в 1)</span>
                                </div>
                            ) : null}
                            {cardPiecesGained && cardPiecesGained > 0 ? (
                                <div className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-950/40 border border-yellow-500/30 rounded-xl text-xs text-yellow-200 font-bold">
                                    <Scissors className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                    <span>+{cardPiecesGained} уламків (з вічного відбою та зламаних геройських карт)</span>
                                </div>
                            ) : null}
                            {cardsGained?.map((card, idx) => (
                                <div 
                                    key={idx} 
                                    className="flex items-center gap-1.5 px-2 py-1 bg-stone-900/90 border border-[#b8860b]/30 rounded-lg text-xs font-black text-amber-300 shadow-sm"
                                >
                                    <span className="text-stone-300 font-serif">{card.suit}</span>
                                    <span>{card.rank} (Трофей)</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-stone-400 leading-normal border-t border-stone-900 pt-1.5">
                            * Карти зі звичайного відбою не повертаються гравцю, а одразу об'єднуються по 4 в 1 пусту карту. Карти з вічного відбою та зламані геройські карти розриваються на уламки!
                        </p>
                    </div>
                ) : null}

                {/* Action Buttons */}
                <div className="w-full flex flex-col gap-2 pt-2">
                    {onOpenCharacterModal && (
                        <button
                            onClick={onOpenCharacterModal}
                            className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Прокачка характеристик</span>
                        </button>
                    )}

                    {isRetiredToNpc ? (
                        <div className="w-full py-2.5 bg-stone-900/90 border border-stone-700 text-[#c4b5a0] font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                            <Beer className="w-3.5 h-3.5 text-amber-400" />
                            <span>Супротивник завершив кар'єру гравця (3/3 перемог) — став мирним НПЦ</span>
                        </div>
                    ) : (
                        <button
                            onClick={onRematch}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>
                                {isVictory 
                                    ? `Зіграти реванш (${currentWins}/3 перемог)` 
                                    : 'Спробувати реванш ⚔️'}
                            </span>
                        </button>
                    )}

                    <button
                        onClick={onReturnToTavern}
                        className="w-full py-2.5 bg-[#292017] hover:bg-[#3d3023] border border-[#b8860b]/50 text-[#f5ebd7] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                        <Beer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Повернутися в таверну «{tavern.name}»</span>
                    </button>

                    <button
                        onClick={onReturnToMap}
                        className="w-full py-2 bg-transparent hover:bg-white/5 text-[#a89988] hover:text-[#f5ebd7] text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                    >
                        🗺️ Вийти на карту світу
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

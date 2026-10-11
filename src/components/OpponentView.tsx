import { Player } from '../types';
import { CardView } from './CardView';
import { Swords, Shield, Clock, Award, Frown } from 'lucide-react';

interface OpponentViewProps {
    key?: string | number;
    player: Player;
    isAttacker: boolean;
    isDefender: boolean;
    isTurn: boolean;
    compact?: boolean;
    prikupCount?: number;
    turnNumber?: number;
}

export const OpponentView = ({ player, isAttacker, isDefender, isTurn, compact, prikupCount, turnNumber }: OpponentViewProps) => {
    const excessCards = player.hand.length > 22 ? player.hand.length - 22 : 0;
    const nextTurnNum = (turnNumber || 1) + 1;
    const predictedDamage = excessCards > 0 ? Math.max(1, Math.floor(Math.pow(excessCards + nextTurnNum, 2) / (2 * nextTurnNum))) : 0;
    return (
        <div className={`flex flex-col items-center gap-1 sm:gap-2 relative ${compact ? 'scale-90' : ''}`}>
            {/* Role Badge */}
            <div className="min-h-6 flex items-center justify-center">
                {player.isEliminated ? (
                    <span className="bg-rose-500/30 text-rose-300 border border-rose-500/50 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm shadow-sm shadow-rose-950/50">
                        💀 Вибув
                    </span>
                ) : player.outRank ? (
                    <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                        <Award className="w-3.5 h-3.5" /> #{player.outRank} місце
                    </span>
                ) : player.hand.length === 0 ? (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                        <Frown className="w-3.5 h-3.5" /> Поразка
                    </span>
                ) : isAttacker ? (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm animate-pulse">
                        <Swords className="w-3.5 h-3.5" /> Атака
                    </span>
                ) : isDefender ? (
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm animate-pulse">
                        <Shield className="w-3.5 h-3.5" /> Захист
                    </span>
                ) : isTurn ? (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                        <Clock className="w-3.5 h-3.5" /> Хід...
                    </span>
                ) : null}
                {Boolean(player.strengthBoost && player.strengthBoost > 0) && (
                    <span className="bg-gradient-to-r from-red-600/30 to-amber-600/30 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-sm animate-pulse" title={`Бонус сили наступної карти: +${player.strengthBoost}`}>
                        ⚔️ +{player.strengthBoost}
                    </span>
                )}
            </div>

            {/* Avatar & Player Info */}
            <div className={`flex flex-col gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-2xl border transition-all ${
                isTurn ? 'border-emerald-400 ring-2 ring-emerald-400/30 bg-slate-800' : 'border-slate-700/80'
            } ${player.isEliminated ? 'opacity-60 bg-slate-900 border-rose-950' : ''}`}>
                <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">{player.isEliminated ? '💀' : player.avatar}</span>
                    <div className="flex flex-col text-left">
                        <span className="text-xs sm:text-sm font-bold text-white leading-tight max-w-[80px] sm:max-w-[100px] truncate">
                            {player.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                            <span 
                                className={excessCards > 0 ? "text-rose-300 font-extrabold animate-pulse bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/60 flex items-center gap-0.5 cursor-help" : "text-slate-400 font-medium"} 
                                title={excessCards > 0 ? `Перевантаження руки! ${excessCards} лишніх карт (понад 22). Прогнозована шкода на ході ${nextTurnNum}: -${predictedDamage} HP (((${excessCards}+${nextTurnNum})²)/(2×${nextTurnNum}))` : ''}
                            >
                                {excessCards > 0 ? `⚠️ ${player.hand.length} карт (+${excessCards} лишніх | -${predictedDamage} HP)` : `${player.hand.length} карт`}
                            </span>
                            <span className="text-amber-300 font-bold flex items-center gap-0.5" title="Карт у власній колоді прикупу">
                                🎴 {prikupCount ?? 0}
                            </span>
                            <span className="text-amber-400 font-extrabold flex items-center gap-0.5" title="Ресурси">
                                ⚡ {player.powerPoints ?? 5}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Health Bar & Text */}
                <div className="flex flex-col gap-0.5 w-full mt-0.5">
                    <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-semibold">
                        <span className="text-slate-400">Здоров'я:</span>
                        <span className={
                            player.isEliminated ? 'text-rose-500 font-bold' : 
                            (player.health ?? 500) <= 100 ? 'text-red-400 animate-pulse font-bold' : 
                            (player.health ?? 500) <= 250 ? 'text-orange-400 font-bold' : 'text-emerald-400 font-bold'
                        }>
                            {player.isEliminated ? '0' : player.health ?? 500}/500 HP
                        </span>
                    </div>
                    <div className="w-full bg-slate-700/50 h-1 sm:h-1.5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${
                                player.isEliminated ? 'bg-rose-900' :
                                (player.health ?? 500) <= 100 ? 'bg-red-500' : 
                                (player.health ?? 500) <= 250 ? 'bg-orange-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${player.isEliminated ? 0 : Math.max(0, Math.min(100, (((player.health ?? 500) / 500) * 100)))}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-semibold mt-0.5">
                        <span className="text-slate-400">Захист:</span>
                        <span className="text-cyan-400 font-bold">
                            🛡️ {player.armor ?? 200}
                        </span>
                    </div>
                </div>
            </div>

            {/* Hidden Hand cards stack */}
            <div className="flex -space-x-12 sm:-space-x-14 overflow-hidden max-w-[140px] sm:max-w-[180px] h-14 sm:h-18 items-center justify-center opacity-85">
                {!player.isEliminated && player.hand.slice(0, 6).map((c, i) => (
                    <div key={`opp-${player.id}-card-${c.id || i}-${i}`} style={{ zIndex: i }}>
                        <CardView hidden className="scale-50 sm:scale-60 -my-4" />
                    </div>
                ))}
            </div>
        </div>
    );
};

import React from 'react';
import { motion } from 'motion/react';
import { TradeCaravan } from '../types';

interface CaravanMapTokenProps {
    caravan: TradeCaravan;
    isSelected: boolean;
    zoom: number;
    onClick: (e: React.MouseEvent) => void;
}

export const CaravanMapToken: React.FC<CaravanMapTokenProps> = ({
    caravan,
    isSelected,
    zoom,
    onClick
}) => {
    const isInCombat = caravan.status === 'in_combat';
    const isReturning = caravan.phase === 'inbound';
    const isPlayer = caravan.isPlayerCaravan;

    // Direction calculation (moving left vs right)
    const targetX = isReturning ? caravan.originPos.x : caravan.destinationPos.x;
    const isMovingLeft = targetX < caravan.currentPos.x;

    // Top goods icons
    const goodsIcons = caravan.goods.slice(0, 3).map(g => g.icon);
    const guardsCount = caravan.guards.length;
    const playerGuardsCount = caravan.guards.filter(g => g.isPlayerCompanion).length;

    const hpPercent = Math.max(0, Math.min(100, Math.round((caravan.caravanHp / Math.max(1, caravan.maxCaravanHp)) * 100)));

    return (
        <div
            style={{
                left: `${caravan.currentPos.x}%`,
                top: `${caravan.currentPos.y}%`,
            }}
            onClick={onClick}
            className={`absolute -translate-x-1/2 -translate-y-full pointer-events-auto select-none cursor-pointer flex flex-col items-center justify-end transition-transform ${
                isInCombat ? 'z-35 scale-125' : isSelected ? 'z-30 scale-120' : 'z-25 hover:scale-115'
            }`}
        >
            {/* Ground Tactical Shadow & Path Aura */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 pointer-events-none flex items-center justify-center">
                <div 
                    className={`w-14 h-5 rounded-[100%] border ${
                        isInCombat 
                            ? 'bg-rose-950/60 border-rose-500 animate-ping' 
                            : isPlayer 
                            ? 'bg-amber-950/60 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.5)]' 
                            : 'bg-stone-900/60 border-stone-600/60'
                    }`}
                />
                <div className="absolute w-12 h-3.5 rounded-[100%] bg-black/85 blur-[1px]" />
            </div>

            {/* Floating Info Banner / Status Above Token */}
            <div className="mb-1 flex flex-col items-center pointer-events-none">
                {/* Battle Alert Tag */}
                {isInCombat && (
                    <motion.div
                        animate={{ scale: [1, 1.15, 1], y: [0, -2, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6 }}
                        className="px-2 py-0.5 rounded-full bg-red-600 text-white border border-red-300 text-[10px] font-black shadow-lg flex items-center gap-1 mb-0.5"
                    >
                        <span>⚔️ АВТОБІЙ З БАНДИТАМИ!</span>
                    </motion.div>
                )}

                {/* Name & Route Tag */}
                <div className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 shadow-md border backdrop-blur-sm whitespace-nowrap ${
                    isPlayer 
                        ? 'bg-[#29170e]/95 text-amber-200 border-amber-500/70' 
                        : 'bg-[#181512]/95 text-stone-300 border-stone-700'
                }`}>
                    <span>{isReturning ? '🔄' : '🚩'}</span>
                    <span>{isReturning ? `${caravan.destinationCityName} ➔ ${caravan.originCityName}` : `${caravan.originCityName} ➔ ${caravan.destinationCityName}`}</span>
                    {isPlayer && (
                        <span className="px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px] font-sans font-bold">
                            Ваш обоз
                        </span>
                    )}
                </div>

                {/* HP & Cargo Badges */}
                <div className="flex items-center gap-1 mt-0.5">
                    {/* Mini Health Bar */}
                    <div className="w-12 h-1.5 bg-stone-950/90 rounded-full overflow-hidden border border-stone-800">
                        <div 
                            className={`h-full transition-all duration-300 ${
                                hpPercent > 60 ? 'bg-emerald-500' : hpPercent > 30 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${hpPercent}%` }}
                        />
                    </div>

                    {/* Cargo Icons */}
                    <div className="flex items-center -space-x-1 bg-black/60 px-1 py-0.2 rounded-full border border-stone-800 text-[9px]">
                        {goodsIcons.map((ic, i) => (
                            <span key={i}>{ic}</span>
                        ))}
                    </div>

                    {/* Guards Count */}
                    <div className="bg-stone-900/90 border border-stone-700 px-1 py-0.2 rounded-full text-[9px] text-stone-300 flex items-center gap-0.5">
                        <span>🛡️</span>
                        <span>{guardsCount}</span>
                        {playerGuardsCount > 0 && (
                            <span className="text-amber-400 font-bold">({playerGuardsCount})</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Animated Wagon & Horse Caravan Token */}
            <motion.div
                animate={isInCombat ? { x: [-2, 2, -2], y: [0, -1, 0] } : { y: [0, -2.5, 0] }}
                transition={{ repeat: Infinity, duration: isInCombat ? 0.25 : 0.6, ease: 'easeInOut' }}
                style={{
                    transform: `scaleX(${isMovingLeft ? -1 : 1})`,
                }}
                className="relative flex items-end gap-0.5 z-20"
            >
                {/* Escort Guard Figurines standing beside the wagon */}
                <div className="relative -mr-1 z-30 flex items-center">
                    <span className="text-lg filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {playerGuardsCount > 0 ? '🤺' : '⚔️'}
                    </span>
                </div>

                {/* Trade Wagon / Cart with Goods */}
                <div className="relative p-1 rounded-xl bg-gradient-to-tr from-[#3a2214] via-[#4d2d19] to-[#2b170c] border-2 border-amber-600/80 shadow-2xl flex items-center justify-center">
                    <span className="text-2xl filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]">
                        🛒
                    </span>
                    {/* Cargo stack on wagon */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center text-xs filter drop-shadow">
                        <span>{goodsIcons[0] || '📦'}</span>
                    </div>
                </div>

                {/* Draft Horse / Beast of Burden pulling the wagon */}
                <div className="relative -ml-1 z-10 flex items-center">
                    <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        🐎
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

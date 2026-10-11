import React from 'react';
import { motion } from 'motion/react';
import { WorldProgress } from '../types';
import { MAP_SOLDIER_SPRITE, getCompanionSprite } from '../lib/companionSprites';

interface PlayerMapTokenProps {
    x: number;
    y: number;
    isMoving: boolean;
    facingDirection: 'left' | 'right';
    progress: WorldProgress;
    onOpenCharacterModal?: () => void;
}

export const PlayerMapToken: React.FC<PlayerMapTokenProps> = ({
    x,
    y,
    isMoving,
    facingDirection,
    progress,
    onOpenCharacterModal
}) => {
    const stats = progress.playerStats;
    const heroLevel = stats?.level ?? 1;
    const hiredCompanions = progress.hiredNpcs || [];
    const totalSquadCount = hiredCompanions.length + 1;
    const isFlipped = facingDirection === 'left';

    // First companion to follow in marching formation if any
    const firstCompanion = hiredCompanions.length > 0 ? hiredCompanions[0] : null;
    const secondCompanion = hiredCompanions.length > 1 ? hiredCompanions[1] : null;

    return (
        <div
            style={{
                left: `${x}%`,
                top: `${y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-full z-30 pointer-events-auto select-none flex flex-col items-center justify-end"
            onClick={(e) => {
                e.stopPropagation();
                if (onOpenCharacterModal) {
                    onOpenCharacterModal();
                }
            }}
        >
            {/* Tabletop Footprint Base / Tactical Zone Ring (anchored at the feet of the commander) */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 pointer-events-none flex items-center justify-center">
                {/* Outer golden compass pulse ring */}
                <div className={`w-14 h-6 rounded-[100%] border-2 border-amber-400/70 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.6)] ${isMoving ? 'animate-ping opacity-60' : 'animate-pulse'}`} />
                {/* Deep grounded contact shadow */}
                <div className="absolute w-12 h-4 rounded-[100%] bg-black/75 blur-[1.5px]" />
                {/* Tactical miniature base edge */}
                <div className="absolute w-10 h-3 rounded-[100%] border border-amber-300/80 bg-gradient-to-r from-amber-700/60 via-yellow-600/60 to-amber-700/60" />
            </div>

            {/* Escort Companion 2 (Trailing soldier in warband march) */}
            {secondCompanion && (
                <motion.div 
                    animate={isMoving ? { y: [0, -3, 0] } : { y: [0, -1, 0] }}
                    transition={{ repeat: Infinity, duration: isMoving ? 0.35 : 2.5, delay: 0.15 }}
                    style={{
                        transform: `scaleX(${isFlipped ? -1 : 1})`,
                    }}
                    className={`absolute bottom-1 pointer-events-none ${isFlipped ? '-right-11' : '-left-11'} opacity-85 z-10`}
                >
                    <div className="relative w-8 sm:w-9 aspect-[1/1.8]">
                        <img 
                            src={getCompanionSprite(secondCompanion)} 
                            alt={secondCompanion.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        />
                        {/* Companion shadow */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-[100%] bg-black/60 blur-[1px]" />
                    </div>
                </motion.div>
            )}

            {/* Escort Companion 1 (Second-in-command walking alongside) */}
            {firstCompanion && (
                <motion.div 
                    animate={isMoving ? { y: [0, -4, 0] } : { y: [0, -1.5, 0] }}
                    transition={{ repeat: Infinity, duration: isMoving ? 0.38 : 2.8, delay: 0.1 }}
                    style={{
                        transform: `scaleX(${isFlipped ? -1 : 1})`,
                    }}
                    className={`absolute bottom-0 pointer-events-none ${isFlipped ? '-right-7' : '-left-7'} opacity-90 z-20`}
                >
                    <div className="relative w-9 sm:w-10 aspect-[1/1.8]">
                        <img 
                            src={getCompanionSprite(firstCompanion)} 
                            alt={firstCompanion.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]"
                        />
                        {/* Companion shadow */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-2 rounded-[100%] bg-black/65 blur-[1px]" />
                    </div>
                </motion.div>
            )}

            {/* Main Character: Commander Soldier Sprite */}
            <motion.div
                animate={
                    isMoving
                        ? { y: [0, -5, 0], rotate: isFlipped ? [0, -1.5, 0] : [0, 1.5, 0] }
                        : { y: [0, -2, 0] }
                }
                transition={{
                    repeat: Infinity,
                    duration: isMoving ? 0.35 : 2.2,
                    ease: "easeInOut"
                }}
                className="relative bottom-0 z-30 cursor-pointer group flex flex-col items-center"
            >
                {/* Overhead Squad Tag / Commander Banner */}
                <div className="mb-1 flex flex-col items-center pointer-events-auto transition-transform group-hover:scale-110">
                    <div className="flex items-center gap-1 bg-[#18110b]/95 border border-amber-400/90 text-amber-200 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.9)] whitespace-nowrap backdrop-blur-sm">
                        <span className="text-xs">👑</span>
                        <span>Ви</span>
                        <span className="text-amber-400 font-mono font-bold ml-0.5">Рів.{heroLevel}</span>
                        {totalSquadCount > 1 && (
                            <span className="ml-1 px-1.5 py-0.2 bg-amber-600/40 border border-amber-500/50 rounded-full text-[9px] text-amber-300 font-mono flex items-center gap-0.5">
                                <span>🛡️</span>
                                <span>{totalSquadCount}</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Soldier Sprite Image Container */}
                <div 
                    className="relative w-11 sm:w-13 h-18 sm:h-22 flex items-center justify-center transition-transform"
                    style={{
                        transform: `scaleX(${isFlipped ? -1 : 1})`,
                    }}
                >
                    <img
                        src={MAP_SOLDIER_SPRITE}
                        alt="Персонаж на карті"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] contrast-105"
                    />

                    {/* Traveling dust/footstep particles indicator when moving */}
                    {isMoving && (
                        <div className="absolute -bottom-2 -left-1 -right-1 flex justify-around pointer-events-none opacity-60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600/60 animate-ping" />
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/40 animate-ping delay-75" />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

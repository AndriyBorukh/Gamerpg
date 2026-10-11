import React from 'react';
import { motion } from 'motion/react';
import { MonsterSquad } from '../lib/monsters/wanderingMonsters';

export const BANDIT_MAP_SPRITE = '/assets/images/bandit_map_sprite_transparent.png';

interface MonsterSquadMapTokenProps {
    squad: MonsterSquad;
    isSelected: boolean;
    zoom: number;
    onClick: (e: React.MouseEvent) => void;
}

export const MonsterSquadMapToken: React.FC<MonsterSquadMapTokenProps> = ({
    squad,
    isSelected,
    zoom,
    onClick
}) => {
    const isChasing = squad.state === 'chasing_player';
    const isRaiding = squad.state === 'raiding';

    // Determine movement direction to flip sprite facing
    const targetX = squad.currentGoal?.targetX ?? squad.x;
    const isMovingLeft = targetX < squad.x;
    const isMoving = squad.state === 'patrolling' || isChasing || isRaiding;

    const alliesCount = squad.allies ? squad.allies.length : 0;
    const totalSquadCount = alliesCount + 1;
    const hasSecondBandit = alliesCount >= 1;
    const hasThirdBandit = alliesCount >= 3;

    return (
        <div
            style={{
                left: `${squad.x}%`,
                top: `${squad.y}%`,
            }}
            onClick={onClick}
            className={`absolute -translate-x-1/2 -translate-y-full pointer-events-auto select-none cursor-pointer flex flex-col items-center justify-end transition-transform ${
                isChasing ? 'z-35 scale-120' : isSelected ? 'z-30 scale-115' : 'z-20 hover:scale-110'
            }`}
        >
            {/* Ground Tactical Base & Threat Aura (anchored at the feet of the standing bandit) */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 pointer-events-none flex items-center justify-center">
                {/* Menacing pulse aura */}
                <div 
                    className={`w-14 h-5 rounded-[100%] border-2 ${
                        isChasing ? 'bg-red-600/40 border-red-500 animate-ping' :
                        isRaiding ? 'bg-amber-600/30 border-amber-400 animate-pulse' :
                        'animate-pulse opacity-60 border-red-600/80 bg-red-950/40'
                    }`}
                    style={{ 
                        borderColor: isChasing ? '#ef4444' : squad.themeColor,
                        boxShadow: `0 0 14px ${isChasing ? '#ef4444' : squad.themeColor}`
                    }}
                />
                {/* Deep grounded contact shadow beneath boots */}
                <div className="absolute w-12 h-3.5 rounded-[100%] bg-black/85 blur-[1px]" />
                {/* Miniature base rim */}
                <div 
                    className="absolute w-10 h-2.5 rounded-[100%] border opacity-80"
                    style={{ 
                        borderColor: squad.themeColor,
                        backgroundColor: `${squad.themeColor}33`
                    }}
                />
            </div>

            {/* Trailing bandit warband minion (marching formation behind leader) */}
            {hasThirdBandit && (
                <motion.div 
                    animate={isMoving ? { y: [0, -3, 0] } : { y: [0, -1, 0] }}
                    transition={{ repeat: Infinity, duration: isChasing ? 0.3 : 0.45, delay: 0.12 }}
                    style={{
                        transform: `scaleX(${isMovingLeft ? -1 : 1}) scale(0.78)`,
                    }}
                    className={`absolute bottom-0.5 pointer-events-none ${isMovingLeft ? '-right-9' : '-left-9'} opacity-75 z-10`}
                >
                    <div className="relative w-9 sm:w-11 h-15 sm:h-18">
                        <img 
                            src={BANDIT_MAP_SPRITE} 
                            alt="Бандит ватаги"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] brightness-90"
                        />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-[100%] bg-black/60 blur-[1px]" />
                    </div>
                </motion.div>
            )}

            {/* Second bandit minion (walking alongside leader) */}
            {hasSecondBandit && (
                <motion.div 
                    animate={isMoving ? { y: [0, -3.5, 0] } : { y: [0, -1.2, 0] }}
                    transition={{ repeat: Infinity, duration: isChasing ? 0.32 : 0.42, delay: 0.08 }}
                    style={{
                        transform: `scaleX(${isMovingLeft ? -1 : 1}) scale(0.88)`,
                    }}
                    className={`absolute bottom-0 pointer-events-none ${isMovingLeft ? '-right-6' : '-left-6'} opacity-85 z-20`}
                >
                    <div className="relative w-10 sm:w-12 h-16 sm:h-19">
                        <img 
                            src={BANDIT_MAP_SPRITE} 
                            alt="Бандит ватаги"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]"
                        />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-2 rounded-[100%] bg-black/65 blur-[1px]" />
                    </div>
                </motion.div>
            )}

            {/* Main Standing Bandit Leader Character Figurine */}
            <motion.div
                animate={
                    isMoving
                        ? { y: [0, -4.5, 0], rotate: isMovingLeft ? [0, -1.5, 0] : [0, 1.5, 0] }
                        : { y: [0, -1.5, 0] }
                }
                transition={{
                    repeat: Infinity,
                    duration: isChasing ? 0.3 : isMoving ? 0.42 : 2.4,
                    ease: "easeInOut"
                }}
                className="relative bottom-0 z-30 flex flex-col items-center"
            >
                {/* Overhead Squad Badge / Leader Tag */}
                <div className="mb-0.5 flex flex-col items-center pointer-events-auto transition-transform group-hover:scale-105">
                    <div 
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.95)] whitespace-nowrap border backdrop-blur-sm text-[10px] font-bold ${
                            isChasing ? 'bg-red-950/95 text-red-200 border-red-500 animate-pulse' : 'bg-[#180f0c]/95 text-stone-200 border-amber-600/80'
                        }`}
                        style={{ borderColor: isChasing ? '#f87171' : squad.themeColor }}
                    >
                        {isChasing ? (
                            <span className="text-red-400 font-black">⚔️</span>
                        ) : isRaiding ? (
                            <span className="text-amber-400">🔥</span>
                        ) : (
                            <span className="text-amber-400">🥷</span>
                        )}

                        <span className="font-serif text-amber-100 font-bold">{squad.name}</span>

                        <span 
                            className="px-1 py-0.2 rounded-full text-[8px] font-black font-mono text-white shadow ml-0.5"
                            style={{ backgroundColor: squad.themeColor }}
                        >
                            Рів.{squad.level}
                        </span>

                        {totalSquadCount > 1 && (
                            <span className="text-[9px] text-amber-300 font-mono flex items-center gap-0.5 bg-black/60 px-1 rounded ml-0.5">
                                <span>👥</span>
                                <span>{totalSquadCount}</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Standing Character Sprite Cutout (identical to player & gambler figurine rendering) */}
                <div 
                    className="relative w-11 sm:w-13 h-18 sm:h-22 flex items-center justify-center transition-transform"
                    style={{
                        transform: `scaleX(${isMovingLeft ? -1 : 1})`,
                    }}
                >
                    <img
                        src={BANDIT_MAP_SPRITE}
                        alt={squad.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)] contrast-105"
                    />

                    {/* Threat indicator icon when actively hunting player */}
                    {isChasing && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 border border-red-300 text-white text-[10px] font-black flex items-center justify-center shadow-lg animate-bounce z-10">
                            ⚔️
                        </div>
                    )}

                    {/* Footstep dust particles when moving */}
                    {isMoving && (
                        <div className="absolute -bottom-1 -left-1 -right-1 flex justify-around pointer-events-none opacity-60">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600/70 animate-ping" />
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-ping delay-75" />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Hover info tooltip */}
            <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none flex flex-col items-center transition-opacity z-40 ${
                zoom >= 1.5 || isChasing || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
                <div className="bg-[#180f0c]/95 border border-red-700/80 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-2xl flex items-center gap-1.5">
                    <span>{squad.name}</span>
                    {isChasing && <span className="text-red-400 font-black animate-pulse">⚔️ ПЕРЕСЛІДУЄ!</span>}
                    {isRaiding && <span className="text-amber-400 font-black">🔥 НАБІГ!</span>}
                </div>
                <div className="text-[9px] text-[#c4b5a0] bg-black/90 px-2 py-0.5 rounded border border-stone-800 max-w-[220px] truncate mt-0.5 shadow-md">
                    🎯 {squad.currentGoal.description}
                </div>
            </div>
        </div>
    );
};

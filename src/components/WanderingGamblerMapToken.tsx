import React from 'react';
import { motion } from 'motion/react';
import { WanderingGambler } from '../lib/wanderingGamblers';

interface WanderingGamblerMapTokenProps {
    gambler: WanderingGambler;
    isSelected: boolean;
    zoom: number;
    onClick: (e: React.MouseEvent) => void;
}

/**
 * Returns the matching pixel-art character sprite for each wandering gambler archetype
 * based on their lore, game type, and aesthetic (monk scholar with staff vs rogue traveler in green capelet).
 */
export function getGamblerMapSprite(gambler: WanderingGambler): string {
    const monkGameTypes = ['senet', 'ur', 'mehen', 'aseb', 'shatranj', 'rpg_cards', 'french_tarot'];
    
    if (
        monkGameTypes.includes(gambler.gameType) || 
        gambler.id.includes('monk') || 
        gambler.id.includes('imhotep') || 
        gambler.id.includes('scholar') ||
        gambler.id.includes('priest')
    ) {
        return '/assets/images/gambler_monk_transparent.png';
    }

    // Default rogue / card sharp / woodsman traveler with brown tunic and green capelet
    return '/assets/images/wandering_gambler_transparent.png';
}

export const WanderingGamblerMapToken: React.FC<WanderingGamblerMapTokenProps> = ({
    gambler,
    isSelected,
    zoom,
    onClick
}) => {
    const spriteUrl = getGamblerMapSprite(gambler);
    
    // Determine movement direction to flip sprite facing
    const targetX = gambler.currentGoal?.targetX ?? gambler.x;
    const isMovingLeft = targetX < gambler.x;
    const isMoving = gambler.state === 'traveling';

    return (
        <div
            style={{
                left: `${gambler.x}%`,
                top: `${gambler.y}%`,
            }}
            onClick={onClick}
            className={`absolute -translate-x-1/2 -translate-y-full z-25 pointer-events-auto select-none cursor-pointer flex flex-col items-center justify-end transition-transform ${
                isSelected ? 'scale-115 z-35' : 'hover:scale-110'
            }`}
        >
            {/* Ground Tactical Base & Pedestal Shadow */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 pointer-events-none flex items-center justify-center">
                {/* Outer colored aura ring */}
                <div 
                    className="w-10 h-4 rounded-[100%] border opacity-70 animate-pulse shadow-md"
                    style={{ 
                        borderColor: gambler.themeColor,
                        backgroundColor: `${gambler.themeColor}33`,
                        boxShadow: `0 0 10px ${gambler.themeColor}66`
                    }}
                />
                {/* Deep grounded contact shadow */}
                <div className="absolute w-8 h-2.5 rounded-[100%] bg-black/80 blur-[1px]" />
            </div>

            {/* Main Pixel Character Sprite Animation */}
            <motion.div
                animate={
                    isMoving
                        ? { y: [0, -3.5, 0], rotate: isMovingLeft ? [0, -1.2, 0] : [0, 1.2, 0] }
                        : { y: [0, -1.5, 0] }
                }
                transition={{
                    repeat: Infinity,
                    duration: isMoving ? 0.4 : 2.4,
                    ease: "easeInOut"
                }}
                className="relative bottom-0 flex flex-col items-center"
            >
                {/* Overhead Badge / Identity Tag */}
                <div className="mb-0.5 flex flex-col items-center pointer-events-auto transition-transform group-hover:scale-105">
                    <div 
                        className="flex items-center gap-1 bg-[#140e0a]/95 text-stone-200 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.9)] whitespace-nowrap border backdrop-blur-sm"
                        style={{ borderColor: `${gambler.themeColor}cc` }}
                    >
                        <span className="text-[11px]">{gambler.badgeIcon}</span>
                        <span className="font-serif text-amber-200">{gambler.name}</span>
                        {gambler.allies && gambler.allies.length > 0 && (
                            <span 
                                className="ml-0.5 px-1 rounded-full text-[8px] font-mono text-white"
                                style={{ backgroundColor: gambler.themeColor }}
                            >
                                +{gambler.allies.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* Pixel Art Character Figurine */}
                <div 
                    className="relative w-10 sm:w-12 h-16 sm:h-20 flex items-center justify-center transition-transform"
                    style={{
                        transform: `scaleX(${isMovingLeft ? -1 : 1})`,
                    }}
                >
                    <img
                        src={spriteUrl}
                        alt={gambler.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)]"
                    />

                    {/* Traveling dust particles when walking along roads */}
                    {isMoving && (
                        <div className="absolute -bottom-1 -left-1 -right-1 flex justify-around pointer-events-none opacity-50">
                            <span className="w-1 h-1 rounded-full bg-amber-600/60 animate-ping" />
                            <span className="w-1 h-1 rounded-full bg-amber-400/40 animate-ping delay-75" />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Hover details tooltip (Discipline & Current destination) */}
            <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none flex flex-col items-center transition-opacity z-40 ${
                zoom >= 2.0 || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
                <div className="bg-[#17110c]/95 border border-amber-500/80 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-2xl flex items-center gap-1.5">
                    <span>{gambler.badgeIcon}</span>
                    <span className="font-serif">{gambler.name}</span>
                    <span className="text-amber-400 font-mono text-[9px] font-normal">({gambler.gameName})</span>
                </div>
                <div className="text-[9px] text-[#e0cfbe] bg-black/90 px-2 py-0.5 rounded border border-amber-900/60 max-w-[220px] truncate mt-0.5 shadow-md">
                    🎯 {gambler.currentGoal.description}
                </div>
            </div>
        </div>
    );
};

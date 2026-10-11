import React from 'react';
import { normalizeSoldierType } from '../lib/toySoldiersData';

export interface ToySoldierFigurineProps {
    type?: string;
    team?: 'player' | 'opponent';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'grid';
    hasActed?: boolean;
    isAlive?: boolean;
    level?: number;
    isSelected?: boolean;
    showBase?: boolean;
    showNameTag?: boolean;
    customName?: string;
    className?: string;
}

export function ToySoldierFigurine({
    type = 'піхотинець',
    team = 'player',
    size = 'md',
    hasActed = false,
    isAlive = true,
    level = 0,
    isSelected = false,
    showBase = true,
    showNameTag = false,
    customName,
    className = ''
}: ToySoldierFigurineProps) {
    const normalizedType = normalizeSoldierType(type);

    if (!isAlive) {
        return (
            <div className={`relative flex flex-col items-center justify-center opacity-40 grayscale ${className}`}>
                <div className="w-8 h-8 rounded-full bg-stone-900/80 border border-stone-800 flex items-center justify-center text-stone-600 font-bold text-xs">
                    ☠️
                </div>
            </div>
        );
    }

    // Dimension mapping
    const dimensions = {
        xs: { container: 'w-6 h-7', base: 'w-6 h-2.5', figure: 'w-6 h-6', font: 'text-[8px]', star: 'w-2 h-2' },
        sm: { container: 'w-8 h-9', base: 'w-8 h-3', figure: 'w-8 h-8', font: 'text-[9px]', star: 'w-2.5 h-2.5' },
        grid: { container: 'w-full h-full max-w-[42px] max-h-[46px]', base: 'w-8 h-3', figure: 'w-9 h-9', font: 'text-[9px]', star: 'w-2 h-2' },
        md: { container: 'w-12 h-14', base: 'w-12 h-4', figure: 'w-12 h-12', font: 'text-[10px]', star: 'w-3 h-3' },
        lg: { container: 'w-16 h-18', base: 'w-16 h-5', figure: 'w-16 h-16', font: 'text-xs', star: 'w-3.5 h-3.5' },
        xl: { container: 'w-24 h-28', base: 'w-24 h-7', figure: 'w-24 h-24', font: 'text-sm', star: 'w-4 h-4' }
    }[size];

    // Team color accents
    const teamColors = team === 'player' ? {
        ring: '#2563eb',
        ringLight: '#60a5fa',
        rimDark: '#1e3a8a',
        glow: 'rgba(37, 99, 235, 0.4)',
        labelBg: 'bg-blue-950/90 text-blue-200 border-blue-500/50'
    } : {
        ring: '#dc2626',
        ringLight: '#f87171',
        rimDark: '#7f1d1d',
        glow: 'rgba(220, 38, 38, 0.4)',
        labelBg: 'bg-red-950/90 text-red-200 border-red-500/50'
    };

    // Render Figurine SVG based on unit type
    const renderFigureSvg = () => {
        switch (normalizedType) {
            case 'стрілець': // Archer (Green hood, longbow)
                return (
                    <g id="archer">
                        {/* Shadow */}
                        <ellipse cx="16" cy="27" rx="6" ry="2" fill="rgba(0,0,0,0.35)" />
                        {/* Legs & Boots */}
                        <path d="M12 21 L11 26 L14 26 L14 21 Z" fill="#452814" />
                        <path d="M18 21 L17 26 L20 26 L20 21 Z" fill="#452814" />
                        {/* Quiver on back */}
                        <path d="M20 12 L24 20 L22 21 L18 13 Z" fill="#5c3818" />
                        <line x1="22" y1="10" x2="25" y2="15" stroke="#f59e0b" strokeWidth="1.5" />
                        <line x1="21" y1="9" x2="24" y2="14" stroke="#f59e0b" strokeWidth="1.5" />
                        {/* Tunic & Belt */}
                        <path d="M12 14 L20 14 L21 22 L11 22 Z" fill="#2d6a37" />
                        <rect x="11.5" y="18" width="9" height="2" fill="#653f1f" />
                        <rect x="15" y="17.5" width="2" height="3" fill="#fbbf24" />
                        {/* Green Hood & Face */}
                        <path d="M11 8 C11 4, 21 4, 21 8 L22 14 L10 14 Z" fill="#22542a" />
                        <circle cx="16" cy="11" r="3" fill="#fcd34d" />
                        <circle cx="15" cy="11" r="0.7" fill="#1e293b" />
                        <path d="M11 7 L16 3 L21 7 L16 9 Z" fill="#2d6a37" /> {/* Hood point */}
                        {/* Bow & Arrow */}
                        <path d="M7 6 Q 3 16 7 26" stroke="#854d0e" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <line x1="7" y1="6" x2="7" y2="26" stroke="#e2e8f0" strokeWidth="0.8" opacity="0.9" />
                        {/* Arrow ready */}
                        <line x1="5" y1="16" x2="18" y2="16" stroke="#78350f" strokeWidth="1.5" />
                        <polygon points="18,16 16,14.5 16,17.5" fill="#94a3b8" />
                        <polygon points="5,16 3,14.5 3,17.5" fill="#f59e0b" />
                    </g>
                );

            case 'щитоносець': // Spearman/Shieldbearer (Red plumed helmet, spear)
            case 'копійник':
                return (
                    <g id="spearman">
                        {/* Shadow */}
                        <ellipse cx="16" cy="27" rx="6" ry="2" fill="rgba(0,0,0,0.35)" />
                        {/* Boots & Greaves */}
                        <rect x="11" y="21" width="3" height="5" fill="#334155" />
                        <rect x="18" y="21" width="3" height="5" fill="#334155" />
                        {/* Red Tunic over Armor */}
                        <path d="M11 13 L21 13 L22 22 L10 22 Z" fill="#b91c1c" />
                        <rect x="13" y="14" width="6" height="7" fill="#64748b" /> {/* Steel plate */}
                        <rect x="10.5" y="18" width="11" height="2" fill="#451a03" /> {/* Belt */}
                        {/* Helmet with Red Plume */}
                        <circle cx="16" cy="9" r="4.5" fill="#94a3b8" />
                        <path d="M12 9 L20 9 L19 13 L13 13 Z" fill="#475569" /> {/* Helmet visor */}
                        <path d="M16 4 Q 21 2 23 7" stroke="#dc2626" strokeWidth="3" fill="none" strokeLinecap="round" /> {/* Red plume */}
                        {/* Spear */}
                        <line x1="4" y1="28" x2="26" y2="2" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                        <polygon points="26,2 29,0 28,5" fill="#e2e8f0" stroke="#475569" strokeWidth="0.5" />
                        {/* Shield on arm */}
                        <ellipse cx="11" cy="17" rx="3.5" ry="5" fill="#991b1b" stroke="#f59e0b" strokeWidth="1" />
                    </g>
                );

            case 'вершник': // Cavalry (Knight on white horse)
                return (
                    <g id="cavalry">
                        {/* Shadow */}
                        <ellipse cx="16" cy="27" rx="10" ry="3" fill="rgba(0,0,0,0.35)" />
                        {/* Horse Body */}
                        <ellipse cx="15" cy="20" rx="9" ry="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
                        {/* Horse Legs */}
                        <line x1="8" y1="23" x2="7" y2="28" stroke="#cbd5e1" strokeWidth="2" />
                        <line x1="12" y1="23" x2="11" y2="28" stroke="#cbd5e1" strokeWidth="2" />
                        <line x1="18" y1="23" x2="19" y2="28" stroke="#cbd5e1" strokeWidth="2" />
                        <line x1="21" y1="23" x2="23" y2="28" stroke="#cbd5e1" strokeWidth="2" />
                        {/* Horse Neck & Head */}
                        <path d="M20 18 Q 24 12 25 8 L28 10 Q 25 18 22 22 Z" fill="#f8fafc" />
                        <path d="M25 8 Q 29 8 28 11 Z" fill="#f8fafc" />
                        {/* Blue Harness */}
                        <path d="M10 18 Q 15 22 22 18" stroke="#2563eb" strokeWidth="1.5" fill="none" />
                        {/* Knight Rider */}
                        <path d="M12 11 L18 11 L19 18 L11 18 Z" fill="#2563eb" /> {/* Blue knight tunic */}
                        <circle cx="15" cy="7" r="3.5" fill="#cbd5e1" /> {/* Helmet */}
                        <path d="M15 3.5 Q 18 2 20 5" stroke="#3b82f6" strokeWidth="2" fill="none" /> {/* Blue plume */}
                        {/* Lance */}
                        <line x1="6" y1="22" x2="28" y2="6" stroke="#94a3b8" strokeWidth="2" />
                        <polygon points="28,6 31,4 30,8" fill="#e2e8f0" />
                    </g>
                );

            case 'маг': // Mage / Wizard (Purple robes, pointed hat, orb staff)
                return (
                    <g id="mage">
                        {/* Shadow */}
                        <ellipse cx="16" cy="27" rx="6" ry="2" fill="rgba(0,0,0,0.35)" />
                        {/* Purple Robe */}
                        <path d="M11 12 L21 12 L24 26 L8 26 Z" fill="#6b21a8" />
                        <path d="M13 12 L19 12 L21 26 L11 26 Z" fill="#581c87" />
                        <path d="M16 12 L16 26" stroke="#fbbf24" strokeWidth="0.8" /> {/* Gold trim */}
                        {/* Belt */}
                        <rect x="12" y="16" width="8" height="1.8" fill="#451a03" />
                        <rect x="15" y="15.5" width="2" height="2.8" fill="#fbbf24" />
                        {/* Wizard Head & Beard */}
                        <circle cx="16" cy="9" r="3" fill="#fde047" /> {/* Face */}
                        <path d="M13 10 C13 15, 19 15, 19 10 C19 16, 13 16, 13 10 Z" fill="#f1f5f9" /> {/* Yellow/white beard */}
                        {/* Pointed Wizard Hat */}
                        <ellipse cx="16" cy="8" rx="6" ry="1.8" fill="#581c87" stroke="#fbbf24" strokeWidth="0.6" />
                        <path d="M11 8 L16 1 L21 8 Z" fill="#6b21a8" />
                        <path d="M16 1 L17 0.5 L18 2 Z" fill="#fbbf24" /> {/* Star tip */}
                        {/* Magic Staff with Glowing Orb */}
                        <line x1="23" y1="26" x2="23" y2="5" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="23" cy="4" r="3.5" fill="#38bdf8" />
                        <circle cx="23" cy="4" r="2" fill="#a5f3fc" />
                        <circle cx="23" cy="4" r="5" fill="#0284c7" opacity="0.35" className="animate-pulse" />
                    </g>
                );

            case 'важкий_лицар': // Heavy Knight (Plate armor, big broadsword)
                return (
                    <g id="heavy_knight">
                        <ellipse cx="16" cy="27" rx="7" ry="2.2" fill="rgba(0,0,0,0.35)" />
                        <rect x="10" y="20" width="4" height="6" fill="#1e293b" />
                        <rect x="18" y="20" width="4" height="6" fill="#1e293b" />
                        <path d="M9 12 L23 12 L24 21 L8 21 Z" fill="#475569" />
                        <path d="M13 12 L19 12 L19 21 L13 21 Z" fill="#f59e0b" /> {/* Gold tabard */}
                        <circle cx="16" cy="8" r="5" fill="#64748b" />
                        <rect x="13" y="7" width="6" height="2" fill="#0f172a" /> {/* Visor slit */}
                        <line x1="24" y1="26" x2="24" y2="3" stroke="#cbd5e1" strokeWidth="2.5" />
                        <polygon points="24,3 22,0 26,0" fill="#f8fafc" />
                        <rect x="21" y="16" width="6" height="2" fill="#fbbf24" />
                    </g>
                );

            case 'гвардієць': // Guard (Royal crest, halberd)
                return (
                    <g id="guard">
                        <ellipse cx="16" cy="27" rx="6" ry="2" fill="rgba(0,0,0,0.35)" />
                        <rect x="11" y="21" width="3.5" height="5" fill="#334155" />
                        <rect x="17.5" y="21" width="3.5" height="5" fill="#334155" />
                        <path d="M10 12 L22 12 L23 22 L9 22 Z" fill="#991b1b" />
                        <path d="M14 12 L18 12 L18 22 L14 22 Z" fill="#f59e0b" />
                        <circle cx="16" cy="8" r="4" fill="#94a3b8" />
                        <path d="M16 2 L18 6 L14 6 Z" fill="#f59e0b" /> {/* Royal crest */}
                        <line x1="24" y1="28" x2="24" y2="1" stroke="#78350f" strokeWidth="2" />
                        <path d="M22 3 L27 5 L24 9 Z" fill="#cbd5e1" /> {/* Halberd axe */}
                        <polygon points="24,1 22,4 26,4" fill="#f8fafc" />
                    </g>
                );

            case 'берсерк': // Berserker (Dual axes)
                return (
                    <g id="berserker">
                        <ellipse cx="16" cy="27" rx="6" ry="2" fill="rgba(0,0,0,0.35)" />
                        <rect x="11" y="20" width="3.5" height="6" fill="#78350f" />
                        <rect x="17.5" y="20" width="3.5" height="6" fill="#78350f" />
                        <path d="M11 12 L21 12 L22 21 L10 21 Z" fill="#b45309" />
                        <circle cx="16" cy="9" r="4" fill="#fde047" />
                        <path d="M13 5 L11 1 M19 5 L21 1" stroke="#f8fafc" strokeWidth="1.8" /> {/* Horns */}
                        <line x1="6" y1="22" x2="6" y2="7" stroke="#451a03" strokeWidth="1.8" />
                        <path d="M3 8 Q 6 5 9 8 Q 6 12 3 8 Z" fill="#94a3b8" />
                        <line x1="26" y1="22" x2="26" y2="7" stroke="#451a03" strokeWidth="1.8" />
                        <path d="M23 8 Q 26 5 29 8 Q 26 12 23 8 Z" fill="#94a3b8" />
                    </g>
                );

            case 'клірик': // Cleric (Holy mace & robes)
                return (
                    <g id="cleric">
                        <ellipse cx="16" cy="27" rx="6" ry="2" fill="rgba(0,0,0,0.35)" />
                        <path d="M10 13 L22 13 L24 26 L8 26 Z" fill="#f8fafc" />
                        <path d="M14 13 L18 13 L19 26 L13 26 Z" fill="#f59e0b" />
                        <circle cx="16" cy="9" r="3.5" fill="#fde047" />
                        <path d="M12 8 C12 4, 20 4, 20 8 Z" fill="#e2e8f0" />
                        <line x1="24" y1="26" x2="24" y2="8" stroke="#b45309" strokeWidth="2" />
                        <circle cx="24" cy="7" r="3" fill="#fbbf24" />
                    </g>
                );

            case 'арбалетник': // Crossbowman
                return (
                    <g id="crossbowman">
                        <ellipse cx="16" cy="27" rx="6" ry="2" fill="rgba(0,0,0,0.35)" />
                        <rect x="11" y="21" width="3" height="5" fill="#451a03" />
                        <rect x="18" y="21" width="3" height="5" fill="#451a03" />
                        <path d="M11 13 L21 13 L22 22 L10 22 Z" fill="#3f6212" />
                        <circle cx="16" cy="9" r="4" fill="#94a3b8" />
                        <line x1="8" y1="16" x2="22" y2="16" stroke="#78350f" strokeWidth="2.5" />
                        <line x1="15" y1="11" x2="15" y2="21" stroke="#475569" strokeWidth="2" />
                    </g>
                );

            case 'асасин': // Assassin (Dark hooded rogue with daggers)
                return (
                    <g id="assassin">
                        <ellipse cx="16" cy="27" rx="5.5" ry="1.8" fill="rgba(0,0,0,0.35)" />
                        <path d="M11 13 L21 13 L23 26 L9 26 Z" fill="#0f172a" />
                        <path d="M12 7 C12 3, 20 3, 20 7 L21 13 L11 13 Z" fill="#1e293b" />
                        <circle cx="14.5" cy="10" r="0.8" fill="#ef4444" />
                        <circle cx="17.5" cy="10" r="0.8" fill="#ef4444" />
                        <line x1="7" y1="20" x2="4" y2="12" stroke="#cbd5e1" strokeWidth="1.8" />
                        <line x1="25" y1="20" x2="28" y2="12" stroke="#cbd5e1" strokeWidth="1.8" />
                    </g>
                );

            case 'алхімік': // Alchemist (Flask/Bomb)
                return (
                    <g id="alchemist">
                        <ellipse cx="16" cy="27" rx="6" ry="2" fill="rgba(0,0,0,0.35)" />
                        <path d="M11 13 L21 13 L23 25 L9 25 Z" fill="#78350f" />
                        <circle cx="16" cy="9" r="4" fill="#fde047" />
                        <rect x="13" y="7" width="6" height="2" fill="#0f172a" /> {/* Goggles */}
                        <circle cx="23" cy="18" r="3.5" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
                        <line x1="23" y1="14" x2="24" y2="12" stroke="#ef4444" strokeWidth="1" />
                    </g>
                );

            case 'паладин': // Paladin (Golden holy warrior)
                return (
                    <g id="paladin">
                        <ellipse cx="16" cy="27" rx="6.5" ry="2" fill="rgba(0,0,0,0.35)" />
                        <rect x="11" y="20" width="3.5" height="6" fill="#b45309" />
                        <rect x="17.5" y="20" width="3.5" height="6" fill="#b45309" />
                        <path d="M10 12 L22 12 L23 21 L9 21 Z" fill="#fbbf24" />
                        <circle cx="16" cy="8" r="4.5" fill="#f59e0b" />
                        <circle cx="16" cy="8" r="6" stroke="#fde047" strokeWidth="0.8" fill="none" opacity="0.6" /> {/* Halo */}
                        <ellipse cx="9" cy="17" rx="4" ry="5.5" fill="#fbbf24" stroke="#fef08a" strokeWidth="1" />
                        <line x1="24" y1="26" x2="24" y2="4" stroke="#fef08a" strokeWidth="2" />
                    </g>
                );

            case 'магічний_пішак':
                return (
                    <g id="magic_pawn">
                        <ellipse cx="16" cy="27" rx="5" ry="1.8" fill="rgba(0,0,0,0.35)" />
                        <path d="M12 24 L20 24 L18 16 L14 16 Z" fill="#a855f7" />
                        <circle cx="16" cy="12" r="3.5" fill="#c084fc" />
                        <path d="M12 10 L16 3 L20 10 Z" fill="#7e22ce" />
                        <line x1="22" y1="24" x2="22" y2="8" stroke="#e9d5ff" strokeWidth="1.5" />
                        <circle cx="22" cy="7" r="2" fill="#38bdf8" />
                    </g>
                );

            case 'військова_шашка_загін':
                return (
                    <g id="military_squad">
                        <ellipse cx="16" cy="27" rx="7" ry="2.2" fill="rgba(0,0,0,0.4)" />
                        <circle cx="16" cy="17" r="9" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                        <circle cx="16" cy="17" r="6.8" fill="#0f172a" />
                        <path d="M11 12 L21 12 L22 21 L10 21 Z" fill="#b91c1c" />
                        <circle cx="16" cy="10" r="4.2" fill="#e2e8f0" stroke="#f59e0b" strokeWidth="0.8" />
                        <path d="M14 5 C14 2.5, 18 2.5, 18 5 L19 9 L13 9 Z" fill="#dc2626" />
                        <circle cx="16" cy="17" r="2.8" fill="#f59e0b" />
                        <line x1="24" y1="26" x2="24" y2="4" stroke="#f59e0b" strokeWidth="2" />
                        <polygon points="24,4 22,1 26,1" fill="#fef08a" />
                    </g>
                );

            case 'шашка_загін':
                return (
                    <g id="checkers_squad">
                        <ellipse cx="16" cy="27" rx="7" ry="2.2" fill="rgba(0,0,0,0.4)" />
                        <ellipse cx="16" cy="22" rx="8" ry="3.5" fill="#991b1b" stroke="#ef4444" strokeWidth="1.2" />
                        <ellipse cx="16" cy="19" rx="8" ry="3.5" fill="#dc2626" stroke="#fca5a5" strokeWidth="0.8" />
                        <ellipse cx="16" cy="16" rx="7" ry="3" fill="#f87171" />
                        <line x1="12" y1="12" x2="20" y2="20" stroke="#fef08a" strokeWidth="1.5" />
                        <line x1="20" y1="12" x2="12" y2="20" stroke="#fef08a" strokeWidth="1.5" />
                        <circle cx="16" cy="16" r="2" fill="#fbbf24" />
                    </g>
                );

            case 'рпг_карти_40':
                return (
                    <g id="rpg_cards">
                        <ellipse cx="16" cy="27" rx="6" ry="2" fill="rgba(0,0,0,0.3)" />
                        <rect x="7" y="8" width="11" height="15" rx="1.5" fill="#7c3aed" stroke="#c084fc" strokeWidth="1" />
                        <rect x="13" y="6" width="11" height="15" rx="1.5" fill="#2563eb" stroke="#93c5fd" strokeWidth="1" />
                        <circle cx="18.5" cy="13.5" r="2.5" fill="#fbbf24" />
                    </g>
                );

            case 'шашка':
                return (
                    <g id="checker">
                        <ellipse cx="16" cy="27" rx="6" ry="2" fill="rgba(0,0,0,0.35)" />
                        <ellipse cx="16" cy="22" rx="7" ry="3" fill="#dc2626" stroke="#b91c1c" strokeWidth="1" />
                        <ellipse cx="16" cy="20" rx="7" ry="3" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8" />
                        <ellipse cx="16" cy="18" rx="6" ry="2.5" fill="#f87171" />
                    </g>
                );

            case 'пішак':
            default: // Default Infantry / Pawn
                return (
                    <g id="infantry">
                        {/* Shadow */}
                        <ellipse cx="16" cy="27" rx="6" ry="2" fill="rgba(0,0,0,0.35)" />
                        {/* Leg Armor & Greaves */}
                        <rect x="11" y="21" width="3" height="5" fill="#334155" />
                        <rect x="18" y="21" width="3" height="5" fill="#334155" />
                        {/* Blue Armor Body */}
                        <path d="M11 13 L21 13 L22 22 L10 22 Z" fill="#2563eb" />
                        <rect x="13" y="14" width="6" height="7" fill="#64748b" /> {/* Steel chestplate */}
                        <rect x="10.5" y="18" width="11" height="2" fill="#1e3a8a" /> {/* Belt */}
                        {/* Helmet & Blue Visor Feather */}
                        <circle cx="16" cy="9" r="4" fill="#cbd5e1" />
                        <path d="M12 9 L20 9 L19 13 L13 13 Z" fill="#475569" />
                        <path d="M16 4 Q 19 2 21 6" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round" />
                        {/* Steel Sword */}
                        <line x1="24" y1="26" x2="24" y2="4" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                        <polygon points="24,4 22,1 26,1" fill="#f8fafc" />
                        <rect x="22" y="18" width="4" height="1.8" fill="#fbbf24" />
                        {/* Blue Heater Shield with Gold Cross */}
                        <path d="M7 13 L14 13 L13 22 L7 18 Z" fill="#1d4ed8" stroke="#3b82f6" strokeWidth="0.8" />
                        <line x1="10.5" y1="13" x2="10.5" y2="20" stroke="#fbbf24" strokeWidth="1.2" />
                        <line x1="7" y1="16" x2="14" y2="16" stroke="#fbbf24" strokeWidth="1.2" />
                    </g>
                );
        }
    };

    const isGrid = size === 'grid';

    return (
        <div className={`relative flex flex-col items-center justify-center select-none ${dimensions.container} ${className}`}>
            {/* Outer Glow / Selected aura */}
            {isSelected && (
                <div 
                    className="absolute inset-0 rounded-full animate-pulse pointer-events-none" 
                    style={{
                        boxShadow: `0 0 16px ${teamColors.glow}, inset 0 0 8px ${teamColors.glow}`,
                        border: `2px solid ${teamColors.ringLight}`
                    }}
                />
            )}

            {/* Main Figurine Graphic (Base + Standing Figure) */}
            <div className={`relative flex items-center justify-center ${hasActed ? 'opacity-60 grayscale-[40%]' : ''}`}>
                <svg 
                    viewBox="0 0 32 32" 
                    className={`${dimensions.figure} drop-shadow-md transition-transform duration-200 hover:scale-105`}
                >
                    {/* 3D Round Wooden Pedestal Base */}
                    {showBase && (
                        <g id="wooden_pedestal">
                            {/* Pedestal Bottom Shadow */}
                            <ellipse cx="16" cy="30" rx="14" ry="2" fill="rgba(0,0,0,0.5)" />
                            {/* 3D Wooden Rim (Cylinder edge) */}
                            <path d="M 2 27 A 14 3 0 0 0 30 27 L 30 29 A 14 3 0 0 1 2 29 Z" fill="#3e220e" />
                            {/* Team Ring Accent on Rim */}
                            <path d="M 2 28 A 14 3 0 0 0 30 28 L 30 28.6 A 14 3 0 0 1 2 28.6 Z" fill={teamColors.ring} />
                            {/* Pedestal Top Rim */}
                            <ellipse cx="16" cy="27" rx="14" ry="3" fill="#6d411f" stroke="#8b5a2b" strokeWidth="0.5" />
                            {/* Lush Green Grass Top Surface */}
                            <ellipse cx="16" cy="26.5" rx="13" ry="2.5" fill="#4a7c2f" />
                            {/* Grass Texture Tufts */}
                            <path d="M 6 26.5 L 7 25 L 8 26.5" stroke="#3b6523" strokeWidth="0.8" fill="none" />
                            <path d="M 15 26 L 16 24.5 L 17 26" stroke="#5a9c38" strokeWidth="0.8" fill="none" />
                            <path d="M 23 26.5 L 24 25 L 25 26.5" stroke="#3b6523" strokeWidth="0.8" fill="none" />
                        </g>
                    )}

                    {/* Standing Figurine */}
                    {renderFigureSvg()}
                </svg>

                {/* Level Star Badge on Pedestal */}
                {level > 0 && (
                    <div className="absolute -bottom-1 flex items-center gap-0.5 bg-stone-950/90 border border-amber-500/80 px-1 py-0.2 rounded-full shadow-md z-10">
                        <span className="text-[8px] font-black text-amber-300 leading-none">★{level}</span>
                    </div>
                )}
            </div>

            {/* Optional Unit Name Tag */}
            {showNameTag && (
                <div className={`mt-0.5 px-1.5 py-0.5 rounded border text-[8px] font-bold tracking-tight truncate max-w-full shadow-sm ${teamColors.labelBg}`}>
                    {customName || normalizedType.toUpperCase()}
                </div>
            )}
        </div>
    );
}

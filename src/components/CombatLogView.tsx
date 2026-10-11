import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CombatLogEntry } from '../types';
import { Scroll, Copy, Check, Trash2, Swords, Shield, Zap, ShoppingBag, Heart, AlertCircle, Sparkles, X } from 'lucide-react';

interface CombatLogViewProps {
    logs?: CombatLogEntry[];
    onClear?: () => void;
    onClose?: () => void;
}

type LogFilter = 'all' | 'combat' | 'spells' | 'damage' | 'shop';

export function CombatLogView({ logs = [], onClear, onClose }: CombatLogViewProps) {
    const [filter, setFilter] = useState<LogFilter>('all');
    const [copied, setCopied] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs, filter]);

    const handleCopy = () => {
        const textToCopy = logs
            .map(log => `[${log.timestamp}] ${log.text}`)
            .join('\n');
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        if (filter === 'combat') return log.type === 'attack' || log.type === 'defense' || log.type === 'pass';
        if (filter === 'spells') return log.type === 'spell';
        if (filter === 'damage') return log.type === 'damage' || log.type === 'elimination';
        if (filter === 'shop') return log.type === 'buy';
        return true;
    });

    const getLogBadgeStyles = (type?: CombatLogEntry['type']) => {
        switch (type) {
            case 'attack':
                return {
                    bg: 'bg-rose-950/40 border-rose-600/40 text-rose-300',
                    icon: Swords,
                    iconColor: 'text-rose-400'
                };
            case 'defense':
                return {
                    bg: 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300',
                    icon: Shield,
                    iconColor: 'text-emerald-400'
                };
            case 'spell':
                return {
                    bg: 'bg-purple-950/40 border-purple-600/40 text-purple-300',
                    icon: Zap,
                    iconColor: 'text-purple-400'
                };
            case 'damage':
                return {
                    bg: 'bg-red-950/60 border-red-500/50 text-red-300 font-bold',
                    icon: Heart,
                    iconColor: 'text-red-400'
                };
            case 'elimination':
                return {
                    bg: 'bg-black/60 border-amber-500/40 text-amber-200 font-extrabold',
                    icon: AlertCircle,
                    iconColor: 'text-amber-400'
                };
            case 'buy':
                return {
                    bg: 'bg-amber-950/40 border-amber-500/40 text-amber-300',
                    icon: ShoppingBag,
                    iconColor: 'text-amber-400'
                };
            case 'pass':
                return {
                    bg: 'bg-blue-950/40 border-blue-600/40 text-blue-300',
                    icon: Sparkles,
                    iconColor: 'text-blue-400'
                };
            default:
                return {
                    bg: 'bg-[#221b16]/70 border-[#b8860b]/30 text-[#e6d8c3]',
                    icon: Scroll,
                    iconColor: 'text-[#d4af37]'
                };
        }
    };

    return (
        <div 
            id="combat-log-container" 
            className="flex flex-col h-full bg-[#181310]/95 border-2 border-[#b8860b]/80 rounded-2xl backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden text-[#f5ebd7]"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#b8860b]/40 bg-[#241c16]/90">
                <div className="flex items-center gap-2">
                    <Scroll className="w-4 h-4 text-[#d4af37]" />
                    <span className="text-sm font-black font-['Cinzel'] tracking-wide text-[#f5ebd7] uppercase">
                        Журнал Битви
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#b8860b]/20 text-[#d4af37] border border-[#b8860b]/40">
                        {logs.length}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCopy}
                        title="Скопіювати історію"
                        className="p-1.5 hover:bg-[#3d2f24] rounded-lg text-[#c4b5a0] hover:text-[#f5ebd7] transition-colors cursor-pointer"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {onClear && (
                        <button
                            onClick={onClear}
                            title="Очистити журнал"
                            className="p-1.5 hover:bg-rose-950/40 rounded-lg text-[#c4b5a0] hover:text-rose-400 transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            title="Закрити"
                            className="p-1.5 hover:bg-[#3d2f24] rounded-lg text-[#c4b5a0] hover:text-white transition-colors cursor-pointer ml-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1c1612] border-b border-[#b8860b]/30 overflow-x-auto scrollbar-none shrink-0">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                        filter === 'all'
                            ? 'bg-[#d4af37] text-[#120f0d] shadow-md border border-amber-300'
                            : 'bg-[#261d17] text-[#a89885] hover:text-[#f5ebd7] hover:bg-[#33271f] border border-[#b8860b]/20'
                    }`}
                >
                    Всі
                </button>
                <button
                    onClick={() => setFilter('combat')}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                        filter === 'combat'
                            ? 'bg-rose-600 text-white shadow-md border border-rose-400'
                            : 'bg-[#261d17] text-[#a89885] hover:text-rose-300 hover:bg-[#33271f] border border-[#b8860b]/20'
                    }`}
                >
                    Бій
                </button>
                <button
                    onClick={() => setFilter('spells')}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                        filter === 'spells'
                            ? 'bg-purple-600 text-white shadow-md border border-purple-400'
                            : 'bg-[#261d17] text-[#a89885] hover:text-purple-300 hover:bg-[#33271f] border border-[#b8860b]/20'
                    }`}
                >
                    Магія
                </button>
                <button
                    onClick={() => setFilter('damage')}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                        filter === 'damage'
                            ? 'bg-red-600 text-white shadow-md border border-red-400'
                            : 'bg-[#261d17] text-[#a89885] hover:text-red-300 hover:bg-[#33271f] border border-[#b8860b]/20'
                    }`}
                >
                    Шкода
                </button>
                <button
                    onClick={() => setFilter('shop')}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                        filter === 'shop'
                            ? 'bg-amber-600 text-[#120f0d] shadow-md border border-amber-400 font-bold'
                            : 'bg-[#261d17] text-[#a89885] hover:text-amber-300 hover:bg-[#33271f] border border-[#b8860b]/20'
                    }`}
                >
                    Крамниця
                </button>
            </div>

            {/* Logs List */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-[#b8860b]/40 scrollbar-track-transparent bg-[#140f0c]"
            >
                {filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#8c765a] text-xs font-medium py-16 italic">
                        📭 Немає записів для цього фільтра
                    </div>
                ) : (
                    filteredLogs.map((log) => {
                        const badge = getLogBadgeStyles(log.type);
                        const Icon = badge.icon;
                        return (
                            <div
                                key={`log-entry-${log.id}`}
                                className={`p-2.5 rounded-xl border flex gap-2.5 items-start ${badge.bg}`}
                            >
                                <div className="mt-0.5 p-1 bg-black/40 rounded-lg border border-[#b8860b]/20 shrink-0">
                                    <Icon className={`w-3.5 h-3.5 ${badge.iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs leading-relaxed break-words">
                                        {log.text}
                                    </p>
                                    <span className="text-[9px] font-mono text-[#8a7762] block mt-1">
                                        ⏱️ {log.timestamp}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

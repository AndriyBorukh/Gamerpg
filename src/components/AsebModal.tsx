import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    RotateCcw, 
    Coins, 
    Trophy, 
    Sparkles, 
    Volume2, 
    VolumeX, 
    X, 
    HelpCircle,
    Star,
    Shield,
    Swords,
    ChevronRight,
    Crown
} from 'lucide-react';

interface AsebModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

export type AsebPlayer = 'player' | 'opponent';

export interface AsebPiece {
    id: string;
    owner: AsebPlayer;
    step: number; // 0 = reserve, 1..16 = on board, 17 = borne off
}

const TOTAL_PIECES = 5;

// Player Path: 4 in row 0 + 12 in central runway row 1 = 16 steps total
export const ASEB_PLAYER_PATH: { r: number; c: number }[] = [
    { r: 0, c: 3 }, // Step 1
    { r: 0, c: 2 }, // Step 2
    { r: 0, c: 1 }, // Step 3
    { r: 0, c: 0 }, // Step 4 (Entry Rosette)
    { r: 1, c: 0 }, // Step 5 (Turn into central runway)
    { r: 1, c: 1 }, // Step 6
    { r: 1, c: 2 }, // Step 7
    { r: 1, c: 3 }, // Step 8 (Runway Rosette)
    { r: 1, c: 4 }, // Step 9
    { r: 1, c: 5 }, // Step 10
    { r: 1, c: 6 }, // Step 11
    { r: 1, c: 7 }, // Step 12 (Runway Rosette)
    { r: 1, c: 8 }, // Step 13
    { r: 1, c: 9 }, // Step 14
    { r: 1, c: 10 }, // Step 15
    { r: 1, c: 11 }, // Step 16 (Final Exit Rosette)
];

// Opponent Path: 4 in row 2 + 12 in central runway row 1 = 16 steps total
export const ASEB_OPPONENT_PATH: { r: number; c: number }[] = [
    { r: 2, c: 3 }, // Step 1
    { r: 2, c: 2 }, // Step 2
    { r: 2, c: 1 }, // Step 3
    { r: 2, c: 0 }, // Step 4 (Entry Rosette)
    { r: 1, c: 0 }, // Step 5
    { r: 1, c: 1 }, // Step 6
    { r: 1, c: 2 }, // Step 7
    { r: 1, c: 3 }, // Step 8 (Runway Rosette)
    { r: 1, c: 4 }, // Step 9
    { r: 1, c: 5 }, // Step 10
    { r: 1, c: 6 }, // Step 11
    { r: 1, c: 7 }, // Step 12 (Runway Rosette)
    { r: 1, c: 8 }, // Step 13
    { r: 1, c: 9 }, // Step 14
    { r: 1, c: 10 }, // Step 15
    { r: 1, c: 11 }, // Step 16 (Final Exit Rosette)
];

// Rosette Coordinates: (0,0), (2,0), (1,3), (1,7), (1,11)
export const ASEB_ROSETTES = [
    { r: 0, c: 0 },
    { r: 2, c: 0 },
    { r: 1, c: 3 },
    { r: 1, c: 7 },
    { r: 1, c: 11 }
];

export function isAsebRosette(r: number, c: number): boolean {
    return ASEB_ROSETTES.some(coord => coord.r === r && coord.c === c);
}

export function initialAsebPieces(): AsebPiece[] {
    const list: AsebPiece[] = [];
    for (let i = 1; i <= TOTAL_PIECES; i++) {
        list.push({ id: `p_${i}`, owner: 'player', step: 0 });
        list.push({ id: `o_${i}`, owner: 'opponent', step: 0 });
    }
    return list;
}

export default function AsebModal({
    expectedXpReward,
    isOpen,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: AsebModalProps) {
    const [pieces, setPieces] = useState<AsebPiece[]>(initialAsebPieces());
    const [turn, setTurn] = useState<AsebPlayer>('player');
    const [sticks, setSticks] = useState<boolean[]>([true, false, true, false]);
    const [rollValue, setRollValue] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState<boolean>(false);
    const [extraThrow, setExtraThrow] = useState<boolean>(false);
    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);
    const [log, setLog] = useState<string[]>(['Гра Асеб (20 клітинок) розпочалася! Киньте палички.']);

    const playTone = (type: 'cast' | 'move' | 'capture' | 'rosette' | 'bear_off' | 'win' | 'lose') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'cast') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(340, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(170, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'move') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(420, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(540, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'capture') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(260, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.22);
                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.22);
                osc.start();
                osc.stop(ctx.currentTime + 0.22);
            } else if (type === 'rosette') {
                [523, 659, 784, 1046].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.07);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.07 + 0.15);
                    o.start(ctx.currentTime + i * 0.07);
                    o.stop(ctx.currentTime + i * 0.07 + 0.15);
                });
            } else if (type === 'bear_off') {
                [440, 554, 659].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.18);
                    o.start(ctx.currentTime + i * 0.08);
                    o.stop(ctx.currentTime + i * 0.08 + 0.18);
                });
            } else if (type === 'win') {
                [523, 659, 784, 1046, 1318].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.35);
                    o.start(ctx.currentTime + i * 0.1);
                    o.stop(ctx.currentTime + i * 0.1 + 0.35);
                });
            } else if (type === 'lose') {
                [300, 260, 220, 180].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.25);
                    o.start(ctx.currentTime + i * 0.12);
                    o.stop(ctx.currentTime + i * 0.12 + 0.25);
                });
            }
        } catch {
            // Audio context unavailable
        }
    };

    const canMovePiece = useCallback((piece: AsebPiece, roll: number): boolean => {
        if (roll <= 0) return false;
        if (piece.step === 17) return false; // borne off

        const target = piece.step + roll;
        if (target > 17) return false; // must bear off exactly

        if (target === 17) return true; // bear off

        // Friendly collision check
        const friendlyOccupied = pieces.some(p => p.owner === piece.owner && p.id !== piece.id && p.step === target);
        if (friendlyOccupied) return false;

        // Enemy collision check on shared runway (steps 5..16)
        if (target >= 5 && target <= 16) {
            const enemyPiece = pieces.find(p => p.owner !== piece.owner && p.step === target);
            if (enemyPiece) {
                // If on a rosette, enemy is immune!
                const coords = ASEB_PLAYER_PATH[target - 1];
                if (isAsebRosette(coords.r, coords.c)) {
                    return false;
                }
            }
        }

        return true;
    }, [pieces]);

    // Throw throwing sticks (1, 2, 3, 4, or 5 if all dark)
    const handleCastSticks = () => {
        if (isRolling || rollValue !== null || gameResult) return;
        setIsRolling(true);
        playTone('cast');

        setTimeout(() => {
            const s1 = Math.random() < 0.5;
            const s2 = Math.random() < 0.5;
            const s3 = Math.random() < 0.5;
            const s4 = Math.random() < 0.5;
            const lightCount = [s1, s2, s3, s4].filter(Boolean).length;
            const value = lightCount === 0 ? 5 : lightCount;

            setSticks([s1, s2, s3, s4]);
            setRollValue(value);
            setIsRolling(false);
            // Clear pending extra throw status when making the throw
            setExtraThrow(false);

            const playerName = turn === 'player' ? 'Ви' : opponent.name;
            setLog(prev => [`🪵 ${playerName} кидає: ${value}`, ...prev.slice(0, 8)]);

            // Check if any moves possible
            const myPieces = pieces.filter(p => p.owner === turn && p.step < 17);
            const canAnyMove = myPieces.some(p => canMovePiece(p, value));

            if (!canAnyMove) {
                setLog(prev => [`🚫 Немає ходів на ${value}! Хід переходить.`, ...prev.slice(0, 8)]);
                setTimeout(() => {
                    setRollValue(null);
                    setExtraThrow(false);
                    setTurn(t => t === 'player' ? 'opponent' : 'player');
                }, 1100);
            }
        }, 550);
    };

    // Execute Move
    const executeMove = useCallback((pieceId: string) => {
        if (rollValue === null || gameResult) return;

        const piece = pieces.find(p => p.id === pieceId);
        if (!piece || piece.owner !== turn) return;
        if (!canMovePiece(piece, rollValue)) return;

        const target = piece.step + rollValue;
        let capturedEnemy = false;

        const updated = pieces.map(p => {
            if (p.id === pieceId) {
                return { ...p, step: target };
            }
            if (target >= 5 && target <= 16 && p.owner !== turn && p.step === target) {
                capturedEnemy = true;
                return { ...p, step: 0 }; // back to reserve!
            }
            return p;
        });

        setPieces(updated);

        const coords = turn === 'player' 
            ? (target === 17 ? null : ASEB_PLAYER_PATH[target - 1])
            : (target === 17 ? null : ASEB_OPPONENT_PATH[target - 1]);

        const landedOnRosette = target !== 17 && coords && isAsebRosette(coords.r, coords.c);

        if (target === 17) {
            playTone('bear_off');
            setLog(prev => [`🌟 ${turn === 'player' ? 'Ваша фішка' : 'Фішка суперника'} успішно зійшла зі злітної смуги!`, ...prev.slice(0, 8)]);
        } else if (capturedEnemy) {
            playTone('capture');
            setLog(prev => [`⚔️ ${turn === 'player' ? 'Ви збили' : `${opponent.name} збиває`} ворожу фішку з центральної смуги!`, ...prev.slice(0, 8)]);
        } else if (landedOnRosette) {
            playTone('rosette');
            setLog(prev => [`🌺 Священна Розетка Асебу! ${turn === 'player' ? 'Ви отримуєте' : `${opponent.name} отримує`} бонусний кидок!`, ...prev.slice(0, 8)]);
        } else {
            playTone('move');
        }

        // Check Victory
        const remaining = updated.filter(p => p.owner === turn && p.step < 17);
        if (remaining.length === 0) {
            if (turn === 'player') {
                playTone('win');
                setGameResult('victory');
            } else {
                playTone('lose');
                setGameResult('defeat');
            }
            setRollValue(null);
            setExtraThrow(false);
            return;
        }

        setRollValue(null);
        // Only grant an extra throw if the piece specifically landed on a Rosette (bonus point)!
        if (landedOnRosette) {
            setExtraThrow(true);
            // Keep current turn for the bonus throw
        } else {
            setExtraThrow(false);
            setTurn(t => t === 'player' ? 'opponent' : 'player');
        }
    }, [rollValue, gameResult, pieces, turn, canMovePiece, opponent.name]);

    // AI Turn Automation
    useEffect(() => {
        if (turn !== 'opponent' || gameResult) return;

        if (rollValue === null && !isRolling) {
            const rollTimer = setTimeout(() => {
                handleCastSticks();
            }, 800);
            return () => clearTimeout(rollTimer);
        }

        if (rollValue !== null) {
            const oppPieces = pieces.filter(p => p.owner === 'opponent' && p.step < 17);
            const valid = oppPieces.filter(p => canMovePiece(p, rollValue));

            if (valid.length === 0) return;

            const aiTimer = setTimeout(() => {
                let best = valid[0];
                let bestScore = -999;

                for (const p of valid) {
                    const target = p.step + rollValue;
                    let score = target;

                    if (target === 17) {
                        score += 100; // Bear off!
                    } else {
                        const coords = ASEB_OPPONENT_PATH[target - 1];
                        if (isAsebRosette(coords.r, coords.c)) score += 40;
                        if (target >= 5 && target <= 16) {
                            const enemyHit = pieces.some(pl => pl.owner === 'player' && pl.step === target);
                            if (enemyHit) score += 60;
                        }
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        best = p;
                    }
                }

                executeMove(best.id);
            }, 900);

            return () => clearTimeout(aiTimer);
        }
    }, [turn, rollValue, isRolling, gameResult, pieces, canMovePiece, executeMove]);

    // Render Aseb Board Grid Cell
    const renderCell = (r: number, c: number) => {
        // Rows 0 and 2 only have columns 0..3! (4 to 11 are empty space around the runway)
        const isBlankSpace = (r === 0 || r === 2) && c >= 4;
        if (isBlankSpace) {
            return (
                <div key={`cell-${r}-${c}`} className="w-8 h-8 sm:w-11 sm:h-11 opacity-0 pointer-events-none" />
            );
        }

        const isRos = isAsebRosette(r, c);

        const playerPieceOnCell = pieces.find(p => {
            if (p.owner !== 'player' || p.step === 0 || p.step === 17) return false;
            const coord = ASEB_PLAYER_PATH[p.step - 1];
            return coord.r === r && coord.c === c;
        });

        const oppPieceOnCell = pieces.find(p => {
            if (p.owner !== 'opponent' || p.step === 0 || p.step === 17) return false;
            const coord = ASEB_OPPONENT_PATH[p.step - 1];
            return coord.r === r && coord.c === c;
        });

        const activePiece = playerPieceOnCell || oppPieceOnCell;
        const isPlayerPieceMovable = playerPieceOnCell && turn === 'player' && rollValue !== null && canMovePiece(playerPieceOnCell, rollValue);

        return (
            <motion.div
                key={`cell-${r}-${c}`}
                whileHover={isPlayerPieceMovable ? { scale: 1.1 } : undefined}
                onClick={() => {
                    if (isPlayerPieceMovable && playerPieceOnCell) {
                        executeMove(playerPieceOnCell.id);
                    }
                }}
                className={`relative w-8 h-8 sm:w-11 sm:h-11 rounded-lg border-2 flex items-center justify-center transition-all select-none shadow-md ${
                    isRos
                        ? 'bg-gradient-to-br from-amber-900/70 to-amber-950 border-amber-400 shadow-amber-500/30'
                        : r === 1
                        ? 'bg-[#1b1510] border-[#8b6535]/80'
                        : r === 0
                        ? 'bg-[#151a24] border-sky-600/60'
                        : 'bg-[#241517] border-rose-700/60'
                } ${isPlayerPieceMovable ? 'ring-2 ring-yellow-400 cursor-pointer shadow-yellow-500/50 animate-pulse' : ''}`}
            >
                {isRos && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-35 pointer-events-none">
                        <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-amber-300" />
                    </div>
                )}

                {activePiece && (
                    <motion.div
                        layoutId={`piece-${activePiece.id}`}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-lg ${
                            activePiece.owner === 'player'
                                ? 'bg-gradient-to-b from-sky-400 to-blue-700 border-sky-100 text-white shadow-blue-500/50'
                                : 'bg-gradient-to-b from-rose-500 to-red-800 border-rose-100 text-white shadow-red-500/50'
                        }`}
                    >
                        {activePiece.owner === 'player' ? '🦂' : '🪲'}
                    </motion.div>
                )}
            </motion.div>
        );
    };

    const playerReserve = pieces.filter(p => p.owner === 'player' && p.step === 0);
    const playerBorneOff = pieces.filter(p => p.owner === 'player' && p.step === 17);

    const oppReserve = pieces.filter(p => p.owner === 'opponent' && p.step === 0);
    const oppBorneOff = pieces.filter(p => p.owner === 'opponent' && p.step === 17);

    const canEnterPlayer = playerReserve.length > 0 && rollValue !== null && canMovePiece(playerReserve[0], rollValue);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="relative w-full max-w-4xl max-h-[96vh] bg-[#120e0b] border-2 border-[#d4af37] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header */}
                <div className="px-4 py-3 bg-[#1a1410] border-b border-[#d4af37]/40 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📐</span>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-amber-300 flex items-center gap-1.5">
                                Асеб — Гра Двадцяти Клітинок (Нове Царство Єгипту)
                            </h2>
                            <p className="text-xs text-amber-200/70">
                                {tavernName} • Суперник: <span className="text-white font-semibold">{opponent.name}</span> ({opponent.title})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-2 bg-[#251b14] hover:bg-[#34261c] border border-[#d4af37]/40 rounded-lg text-amber-300 transition"
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="p-2 bg-[#251b14] hover:bg-[#34261c] border border-[#d4af37]/40 rounded-lg text-amber-300 transition"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 bg-[#251b14] hover:bg-[#34261c] border border-[#d4af37]/40 rounded-lg text-amber-300 hover:text-white transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-4">
                    {/* Opponent Banner */}
                    <div className="flex items-center justify-between bg-[#18130f] border border-[#d4af37]/30 rounded-xl p-2.5 sm:p-3">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl sm:text-4xl">{opponent.avatar}</span>
                            <div>
                                <div className="text-sm sm:text-base font-bold text-rose-300 flex items-center gap-1.5">
                                    <span>{opponent.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300">
                                        {opponent.difficulty}
                                    </span>
                                </div>
                                <p className="text-xs text-stone-400 italic">«{opponent.flavorQuote}»</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                            <div>
                                <span className="text-[10px] text-stone-400">Зійшли зі смуги</span>
                                <div className="flex items-center gap-1 text-rose-400 font-bold text-sm sm:text-base">
                                    <Trophy className="w-4 h-4" />
                                    <span>{oppBorneOff.length} / {TOTAL_PIECES}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Aseb Board (12 columns x 3 rows with narrow 8-cell runway) */}
                    <div className="flex flex-col items-center justify-center p-3 sm:p-5 bg-gradient-to-b from-[#18120e] to-[#0e0a07] border border-[#d4af37]/50 rounded-2xl shadow-inner relative overflow-x-auto">
                        <div className="grid grid-cols-12 gap-1 sm:gap-1.5 min-w-[360px] sm:min-w-0">
                            {/* Row 0: Player's entry (cols 0..3) + blank space (cols 4..11) */}
                            {Array.from({ length: 12 }, (_, c) => renderCell(0, c))}
                            {/* Row 1: Long 12-cell central runway (cols 0..11) */}
                            {Array.from({ length: 12 }, (_, c) => renderCell(1, c))}
                            {/* Row 2: Opponent's entry (cols 0..3) + blank space (cols 4..11) */}
                            {Array.from({ length: 12 }, (_, c) => renderCell(2, c))}
                        </div>

                        <div className="w-full flex justify-between items-center text-[10px] text-amber-400/60 px-2 mt-3">
                            <span>← Вхід зі стартових клітин</span>
                            <span className="text-amber-300 font-semibold">12-клітинна злітна смуга битви</span>
                            <span>Фінішний вихід →</span>
                        </div>
                    </div>

                    {/* Reserves & Throw Sticks */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        {/* Player Reserve */}
                        <div className="p-3 bg-[#161a22] border border-sky-500/40 rounded-xl flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs text-sky-300 font-bold">
                                <span>Ваш резерв</span>
                                <span>{playerReserve.length} фішок</span>
                            </div>
                            <div className="flex gap-1.5">
                                {playerReserve.map(p => (
                                    <div key={p.id} className="w-6 h-6 rounded-full bg-blue-600 border border-sky-300 flex items-center justify-center text-[11px] shadow">
                                        🦂
                                    </div>
                                ))}
                                {playerReserve.length === 0 && (
                                    <span className="text-xs text-sky-400/60 italic">Усі скорпіони на смузі!</span>
                                )}
                            </div>
                            {canEnterPlayer && (
                                <button
                                    onClick={() => executeMove(playerReserve[0].id)}
                                    className="w-full py-1.5 bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 text-white text-xs font-bold rounded-lg shadow-md transition animate-pulse"
                                >
                                    Ввести скорпіона на крок {rollValue}
                                </button>
                            )}
                        </div>

                        {/* Sticks Casting Panel */}
                        <div className="p-3 bg-[#1e1611] border-2 border-amber-500/50 rounded-xl flex flex-col items-center justify-center gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-300">
                                    {turn === 'player' ? 'Ваш хід' : `Хід: ${opponent.name}`}
                                </span>
                                {extraThrow && (
                                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[9px] font-black rounded-full uppercase flex items-center gap-1 shadow">
                                        🌺 Бонус Розетки (+1 кидок)
                                    </span>
                                )}
                            </div>

                            {/* 4 Casting Sticks */}
                            <div className="flex items-center gap-2">
                                {sticks.map((isLight, idx) => (
                                    <motion.div
                                        key={idx}
                                        animate={isRolling ? { rotate: [0, 180, 360], y: [0, -8, 0] } : {}}
                                        transition={{ duration: 0.35, repeat: isRolling ? Infinity : 0 }}
                                        className={`w-4 h-12 rounded-full border flex items-center justify-center shadow-md ${
                                            isLight
                                                ? 'bg-gradient-to-t from-amber-100 to-amber-200 border-white shadow-amber-300/30'
                                                : 'bg-stone-800 border-stone-600 shadow-inner'
                                        }`}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                {rollValue !== null ? (
                                    <div className="text-sm font-bold text-amber-200">
                                        Кроків: <span className="text-xl text-yellow-300 font-extrabold">{rollValue}</span>
                                    </div>
                                ) : (
                                    <button
                                        disabled={turn !== 'player' || isRolling}
                                        onClick={handleCastSticks}
                                        className={`px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold text-sm rounded-xl shadow-lg transition flex items-center gap-2 ${
                                            turn !== 'player' || isRolling ? 'opacity-50 cursor-not-allowed' : 'animate-bounce'
                                        }`}
                                    >
                                        <span>Кинути Палички Асебу</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Player Borne Off */}
                        <div className="p-3 bg-[#1d1611] border border-amber-500/40 rounded-xl flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs text-amber-300 font-bold">
                                <span>Зійшли зі смуги</span>
                                <span>{playerBorneOff.length} / {TOTAL_PIECES}</span>
                            </div>
                            <div className="flex gap-1.5">
                                {playerBorneOff.map(p => (
                                    <div key={p.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border border-yellow-200 shadow flex items-center justify-center text-[10px]">
                                        ⭐
                                    </div>
                                ))}
                            </div>
                            <p className="text-[11px] text-stone-400">
                                Хто першим проведе всі 5 фішок через довгу злітну смугу та виведе їх — перемагає!
                            </p>
                        </div>
                    </div>

                    {/* Battle Log */}
                    <div className="bg-[#120d0a] border border-[#d4af37]/30 rounded-xl p-3 flex flex-col gap-1 max-h-24 overflow-y-auto text-xs font-mono">
                        <div className="text-[10px] uppercase font-bold text-amber-400/80 mb-0.5">Літопис Асебу:</div>
                        {log.map((entry, idx) => (
                            <div key={idx} className={idx === 0 ? 'text-amber-200 font-semibold' : 'text-stone-400'}>
                                {entry}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rules Dialog */}
                <AnimatePresence>
                    {showRules && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md p-4 sm:p-6 flex flex-col overflow-y-auto text-sm text-[#f5ebd7]"
                        >
                            <div className="flex justify-between items-center pb-3 border-b border-amber-500/40">
                                <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                                    <span>📜</span> Правила гри Асеб (20 клітинок)
                                </h3>
                                <button
                                    onClick={() => setShowRules(false)}
                                    className="p-1.5 bg-[#251b14] hover:bg-[#34261c] rounded-lg text-amber-300 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 py-4 flex flex-col gap-3 leading-relaxed text-stone-300">
                                <p>
                                    <strong className="text-amber-300">Асеб (Гра двадцяти клітинок)</strong> — царська настільна гра Нового Царства Єгипту, вишукані дошки якої виготовлялися зі слонової кістки та золота (знайдена в гробниці Тутанхамона на звороті дошки Сенету).
                                </p>
                                <div className="bg-[#1b140f] p-3 rounded-lg border border-amber-500/30 flex flex-col gap-1.5">
                                    <h4 className="font-bold text-amber-300">📐 Будова дошки:</h4>
                                    <p>Дошка складається з 3 рядів по 4 клітинки на початку та довгої центральної смуги з 8 клітинок (всього 20 клітинок). Гравці починають у своїх бічних рядах і сходяться на довгій центральній злітній смузі.</p>
                                </div>
                                <div className="bg-[#1b140f] p-3 rounded-lg border border-amber-500/30 flex flex-col gap-1.5">
                                    <h4 className="font-bold text-amber-300">🌺 Розетки та безпека:</h4>
                                    <p>Розетки розташовані на вході та вздовж центральної смуги. Вони захищають фішку від збиття та надають додатковий кидок паличок!</p>
                                </div>
                                <div className="bg-[#1b140f] p-3 rounded-lg border border-amber-500/30 flex flex-col gap-1.5">
                                    <h4 className="font-bold text-amber-300">⚔️ Збиття:</h4>
                                    <p>На звичайних клітинках центральної смуги посадка на ворожу фішку вибиває її геть назад у резерв.</p>
                                </div>
                                <div className="bg-[#1b140f] p-3 rounded-lg border border-amber-500/30 flex flex-col gap-1.5">
                                    <h4 className="font-bold text-amber-300">🏆 Перемога:</h4>
                                    <p>Хто першим проведе всі 5 своїх фішок до кінця злітної смуги та виведе їх — перемагає у поєдинку!</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowRules(false)}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl shadow-lg hover:brightness-110 transition"
                            >
                                Зрозуміло, розпочати!
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Victory / Defeat Overlay */}
                <AnimatePresence>
                    {gameResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md bg-[#18120e] border-2 border-amber-500 rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl gap-4">
                                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl">
                                    {gameResult === 'victory' ? '👑' : '💀'}
                                </div>

                                <div>
                                    <h3 className={`text-2xl font-black ${gameResult === 'victory' ? 'text-amber-300' : 'text-rose-400'}`}>
                                        {gameResult === 'victory' ? 'Перемога у Грі Асеб!' : 'Поразка на дошці Асебу'}
                                    </h3>
                                    <p className="text-sm text-stone-300 mt-1">
                                        {gameResult === 'victory'
                                            ? `Ви вивели всіх своїх скорпіонів зі смуги швидше за ${opponent.name}!`
                                            : `${opponent.name} здобув першість на 20 клітинках царської дошки.`}
                                    </p>
                                </div>

                                {gameResult === 'victory' && (
                                    <div className="w-full bg-[#241a13] border border-amber-500/40 rounded-xl p-3 flex justify-around text-xs font-bold text-amber-200">
                                        <div className="flex items-center gap-1.5">
                                            <Coins className="w-4 h-4 text-yellow-400" />
                                            <span>+{opponent.rewards.gold} Золота</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-purple-400" />
                                            <span>+{expectedXpReward ?? opponent.rewards.xp} Досвіду</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => {
                                            setPieces(initialAsebPieces());
                                            setTurn('player');
                                            setRollValue(null);
                                            setGameResult(null);
                                            setLog(['Партія скинута. Ваш хід!']);
                                        }}
                                        className="flex-1 py-3 bg-[#2b1f17] hover:bg-[#3d2d22] text-amber-300 border border-amber-500/50 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-sm"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span>Реванш</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (gameResult === 'victory') {
                                                onVictory();
                                            } else {
                                                onDefeat();
                                            }
                                        }}
                                        className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold rounded-xl shadow-lg transition text-sm"
                                    >
                                        {gameResult === 'victory' ? 'Забрати Нагороди' : 'Вийти'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

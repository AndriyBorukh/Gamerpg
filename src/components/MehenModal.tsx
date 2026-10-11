import { useState, useEffect, useCallback, useMemo } from 'react';
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
    Sun,
    Flame,
    Eye,
    Shield,
    Swords,
    Crown
} from 'lucide-react';

interface MehenModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

export type MehenPlayer = 'player' | 'opponent';

export interface MehenPiece {
    id: string;
    owner: MehenPlayer;
    step: number; // 0 = in reserve, 1..35 = along spiral, 36 = reached Head of Mehen!
}

const TOTAL_PIECES = 4;
const TOTAL_TILES = 36;

export const SPECIAL_MEHEN_TILES: Record<number, { name: string; type: 'safe' | 'boost' | 'trap'; effect: string; icon: string }> = {
    6: { name: 'Священне Джерело', type: 'safe', effect: 'Безпечна клітинка. Не можна збити.', icon: '💧' },
    12: { name: 'Кільце Урея', type: 'boost', effect: 'Стрибок уперед на +2 клітинки!', icon: '⚡' },
    18: { name: 'Оаза Ра', type: 'safe', effect: 'Безпечна зона та благословення сонця.', icon: '☀️' },
    24: { name: 'Пастка Апопа', type: 'trap', effect: 'Підступний укус! Відкидає на 2 клітинки назад.', icon: '🐍' },
    30: { name: 'Терези Маат', type: 'safe', effect: 'Захист істини. Вороги не можуть вас вибити.', icon: '⚖️' },
    36: { name: 'Голова Змія Мехена', type: 'safe', effect: 'Фініш! Священне вознесіння душі.', icon: '👑' }
};

export function initialMehenPieces(): MehenPiece[] {
    const list: MehenPiece[] = [];
    for (let i = 1; i <= TOTAL_PIECES; i++) {
        list.push({ id: `p_${i}`, owner: 'player', step: 0 });
        list.push({ id: `o_${i}`, owner: 'opponent', step: 0 });
    }
    return list;
}

// Polar/spiral coordinate positioning for 36 spiral cells
// Ring 1 (outer): 1..18, Ring 2 (mid): 19..29, Ring 3 (inner): 30..35, Center: 36
export function getTileCoordinate(tile: number): { x: number; y: number; angleDeg: number } {
    const centerX = 50;
    const centerY = 50;

    if (tile === 36) {
        return { x: centerX, y: centerY, angleDeg: 0 };
    }

    if (tile <= 18) {
        // Outer ring (radius ~ 42%)
        const fraction = (tile - 1) / 18;
        const angle = fraction * 2 * Math.PI - Math.PI / 2; // start top
        return {
            x: centerX + 40 * Math.cos(angle),
            y: centerY + 40 * Math.sin(angle),
            angleDeg: (angle * 180) / Math.PI
        };
    } else if (tile <= 29) {
        // Middle ring (radius ~ 27%)
        const fraction = (tile - 19) / 11;
        const angle = fraction * 2 * Math.PI - Math.PI / 2;
        return {
            x: centerX + 26 * Math.cos(angle),
            y: centerY + 26 * Math.sin(angle),
            angleDeg: (angle * 180) / Math.PI
        };
    } else {
        // Inner ring (radius ~ 14%)
        const fraction = (tile - 30) / 6;
        const angle = fraction * 2 * Math.PI - Math.PI / 2;
        return {
            x: centerX + 13 * Math.cos(angle),
            y: centerY + 13 * Math.sin(angle),
            angleDeg: (angle * 180) / Math.PI
        };
    }
}

export default function MehenModal({
    expectedXpReward,
    isOpen,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: MehenModalProps) {
    const [pieces, setPieces] = useState<MehenPiece[]>(initialMehenPieces());
    const [turn, setTurn] = useState<MehenPlayer>('player');
    const [sticks, setSticks] = useState<boolean[]>([true, false, true, false]);
    const [rollValue, setRollValue] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState<boolean>(false);
    const [extraThrow, setExtraThrow] = useState<boolean>(false);
    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);
    const [log, setLog] = useState<string[]>(['Гра Мехен почалася! Киньте священні палички.']);

    const playTone = (type: 'cast' | 'move' | 'trap' | 'boost' | 'reach_head' | 'win' | 'lose') => {
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
                osc.frequency.setValueAtTime(360, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'move') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(460, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(580, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'trap') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(280, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.25);
                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'boost') {
                [523, 659, 784].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.08);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);
                    o.start(ctx.currentTime + i * 0.08);
                    o.stop(ctx.currentTime + i * 0.08 + 0.15);
                });
            } else if (type === 'reach_head') {
                [523, 659, 784, 1046].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.09);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.09 + 0.2);
                    o.start(ctx.currentTime + i * 0.09);
                    o.stop(ctx.currentTime + i * 0.09 + 0.2);
                });
            } else if (type === 'win') {
                [440, 554, 659, 880, 1108].forEach((f, i) => {
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
                [260, 220, 180, 140].forEach((f, i) => {
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
            // Audio blocked
        }
    };

    const canMovePiece = useCallback((piece: MehenPiece, roll: number): boolean => {
        if (roll <= 0) return false;
        if (piece.step === 36) return false; // already completed

        const targetStep = piece.step + roll;
        // Cap at 36
        const effectiveTarget = Math.min(36, targetStep);

        // Cannot land on friendly piece (except head 36 where all can congregate)
        if (effectiveTarget < 36) {
            const friendlyOccupied = pieces.some(p => p.owner === piece.owner && p.id !== piece.id && p.step === effectiveTarget);
            if (friendlyOccupied) return false;
        }

        return true;
    }, [pieces]);

    // Handle stick casting
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
            const value = lightCount === 0 ? 5 : lightCount; // 0 light = 5 points

            setSticks([s1, s2, s3, s4]);
            setRollValue(value);
            setIsRolling(false);
            // Clear pending bonus throw when roll is made
            setExtraThrow(false);

            const playerName = turn === 'player' ? 'Ви' : opponent.name;
            setLog(prev => [`🪵 ${playerName} кидає палички: ${value}`, ...prev.slice(0, 8)]);

            // Check if any moves possible
            const activePieces = pieces.filter(p => p.owner === turn && p.step < 36);
            const canAnyMove = activePieces.some(p => canMovePiece(p, value));

            if (!canAnyMove) {
                setLog(prev => [`🚫 Немає можливих ходів на ${value}! Хід переходить.`, ...prev.slice(0, 8)]);
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

        let target = Math.min(36, piece.step + rollValue);
        let specialMsg = '';
        let landedOnBonus = false;

        // Check special tile triggers
        const special = SPECIAL_MEHEN_TILES[target];
        if (special) {
            if (special.type === 'boost') {
                target = Math.min(36, target + 2);
                specialMsg = `⚡ Кільце Урея! Стрибок уперед на клітинку ${target} та додатковий кидок!`;
                playTone('boost');
                landedOnBonus = true;
            } else if (special.type === 'trap') {
                target = Math.max(1, target - 2);
                specialMsg = `🐍 Пастка Апопа! Відкинуто назад на ${target}.`;
                playTone('trap');
            }
        }

        // Check if landing on enemy lone piece (if target < 36 and not safe)
        let captured = false;
        const targetIsSafe = SPECIAL_MEHEN_TILES[target]?.type === 'safe';

        const updatedPieces = pieces.map(p => {
            if (p.id === pieceId) {
                return { ...p, step: target };
            }
            if (target < 36 && !targetIsSafe && p.owner !== turn && p.step === target) {
                captured = true;
                const knockedBack = Math.max(0, p.step - 3);
                return { ...p, step: knockedBack };
            }
            return p;
        });

        setPieces(updatedPieces);

        if (target === 36) {
            playTone('reach_head');
            setLog(prev => [`👑 ${turn === 'player' ? 'Ваша фішка' : 'Фішка суперника'} досягла Голови Мехена!`, ...prev.slice(0, 8)]);
        } else if (captured) {
            playTone('trap');
            setLog(prev => [`⚔️ ${turn === 'player' ? 'Ви відкинули' : `${opponent.name} відкидає`} ворожу фішку на 3 кроки назад!`, ...prev.slice(0, 8)]);
        } else if (specialMsg) {
            setLog(prev => [specialMsg, ...prev.slice(0, 8)]);
        } else {
            playTone('move');
        }

        // Check Victory condition (all pieces reached 36)
        const myLeft = updatedPieces.filter(p => p.owner === turn && p.step < 36);
        if (myLeft.length === 0) {
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
        // Only grant an extra throw if landed on bonus tile (Ring of Uraeus)
        if (landedOnBonus) {
            setExtraThrow(true);
            // Keep current turn
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
            const oppPieces = pieces.filter(p => p.owner === 'opponent' && p.step < 36);
            const valid = oppPieces.filter(p => canMovePiece(p, rollValue));

            if (valid.length === 0) return;

            const aiTimer = setTimeout(() => {
                // Pick best piece:
                // 1. One that reaches 36
                // 2. One that captures player
                // 3. One that lands on boost
                // 4. One that is furthest along
                let best = valid[0];
                let bestScore = -999;

                for (const p of valid) {
                    const target = Math.min(36, p.step + rollValue);
                    let score = target;
                    if (target === 36) score += 100;
                    if (SPECIAL_MEHEN_TILES[target]?.type === 'boost') score += 30;
                    if (SPECIAL_MEHEN_TILES[target]?.type === 'trap') score -= 25;
                    const enemyHit = target < 36 && SPECIAL_MEHEN_TILES[target]?.type !== 'safe' && pieces.some(pl => pl.owner === 'player' && pl.step === target);
                    if (enemyHit) score += 50;

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

    const playerReserve = pieces.filter(p => p.owner === 'player' && p.step === 0);
    const playerFinished = pieces.filter(p => p.owner === 'player' && p.step === 36);

    const oppReserve = pieces.filter(p => p.owner === 'opponent' && p.step === 0);
    const oppFinished = pieces.filter(p => p.owner === 'opponent' && p.step === 36);

    const canEnterPlayer = playerReserve.length > 0 && rollValue !== null && canMovePiece(playerReserve[0], rollValue);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="relative w-full max-w-4xl max-h-[96vh] bg-[#140f0c] border-2 border-orange-500/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header */}
                <div className="px-4 py-3 bg-[#1d1410] border-b border-orange-500/40 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🐍</span>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-orange-300 flex items-center gap-1.5">
                                Мехен — Гра Священного Змія (3000 до н.е.)
                            </h2>
                            <p className="text-xs text-orange-200/70">
                                {tavernName} • Суперник: <span className="text-white font-semibold">{opponent.name}</span> ({opponent.title})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-2 bg-[#261812] hover:bg-[#382218] border border-orange-500/40 rounded-lg text-orange-300 transition"
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="p-2 bg-[#261812] hover:bg-[#382218] border border-orange-500/40 rounded-lg text-orange-300 transition"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 bg-[#261812] hover:bg-[#382218] border border-orange-500/40 rounded-lg text-orange-300 hover:text-white transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-4">
                    {/* Opponent Banner */}
                    <div className="flex items-center justify-between bg-[#1a120e] border border-orange-500/30 rounded-xl p-2.5 sm:p-3">
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
                                <span className="text-[10px] text-stone-400">У Голові Змія</span>
                                <div className="flex items-center gap-1 text-orange-400 font-bold text-sm sm:text-base">
                                    <Crown className="w-4 h-4" />
                                    <span>{oppFinished.length} / {TOTAL_PIECES}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mehen Coiled Serpent Board View */}
                    <div className="relative w-full max-w-[500px] aspect-square mx-auto bg-gradient-to-br from-[#201510] via-[#160f0c] to-[#0c0806] border-2 border-orange-500/60 rounded-full shadow-2xl p-4 flex items-center justify-center overflow-hidden">
                        {/* Spiral track background rings */}
                        <div className="absolute inset-4 rounded-full border border-orange-500/20 pointer-events-none" />
                        <div className="absolute inset-16 rounded-full border border-orange-500/30 pointer-events-none" />
                        <div className="absolute inset-28 rounded-full border border-orange-500/40 pointer-events-none" />

                        {/* All 36 spiral tiles positioned along concentric coordinates */}
                        {Array.from({ length: TOTAL_TILES }, (_, i) => i + 1).map(tileNum => {
                            const { x, y } = getTileCoordinate(tileNum);
                            const special = SPECIAL_MEHEN_TILES[tileNum];
                            const isHead = tileNum === 36;

                            const playerPiecesHere = pieces.filter(p => p.owner === 'player' && p.step === tileNum);
                            const oppPiecesHere = pieces.filter(p => p.owner === 'opponent' && p.step === tileNum);

                            const playerCanMove = turn === 'player' && rollValue !== null && playerPiecesHere.some(p => canMovePiece(p, rollValue));

                            return (
                                <motion.div
                                    key={`tile-${tileNum}`}
                                    onClick={() => {
                                        if (playerCanMove && playerPiecesHere.length > 0) {
                                            executeMove(playerPiecesHere[0].id);
                                        }
                                    }}
                                    style={{
                                        left: `${x}%`,
                                        top: `${y}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    className={`absolute rounded-full border flex items-center justify-center transition-all select-none ${
                                        isHead
                                            ? 'w-16 h-16 bg-gradient-to-br from-yellow-400 via-amber-600 to-orange-700 border-yellow-200 z-20 shadow-lg shadow-orange-500/40'
                                            : special
                                            ? 'w-8 h-8 sm:w-9 sm:h-9 bg-orange-900/60 border-orange-400 z-10'
                                            : 'w-7 h-7 sm:w-8 sm:h-8 bg-[#211510] border-[#5e3820] z-0'
                                    } ${playerCanMove ? 'ring-2 ring-yellow-400 cursor-pointer animate-pulse' : ''}`}
                                >
                                    {isHead ? (
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-xl">👑</span>
                                            <span className="text-[8px] font-extrabold text-black uppercase">Мехен</span>
                                        </div>
                                    ) : special ? (
                                        <span className="text-xs">{special.icon}</span>
                                    ) : (
                                        <span className="text-[9px] text-orange-200/60 font-semibold">{tileNum}</span>
                                    )}

                                    {/* Pieces sitting on this tile */}
                                    {playerPiecesHere.length > 0 && (
                                        <div className="absolute -top-1 -left-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-sky-500 border border-white text-[9px] flex items-center justify-center font-bold text-white shadow-md">
                                            🦅{playerPiecesHere.length > 1 ? playerPiecesHere.length : ''}
                                        </div>
                                    )}
                                    {oppPiecesHere.length > 0 && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-600 border border-white text-[9px] flex items-center justify-center font-bold text-white shadow-md">
                                            🐕{oppPiecesHere.length > 1 ? oppPiecesHere.length : ''}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Bottom Controls & Sticks */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        {/* Player Reserve */}
                        <div className="p-3 bg-[#1c1410] border border-sky-500/40 rounded-xl flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs text-sky-300 font-bold">
                                <span>Ваш резерв (на хвості змія)</span>
                                <span>{playerReserve.length} фішок</span>
                            </div>
                            <div className="flex gap-1.5">
                                {playerReserve.map(p => (
                                    <div key={p.id} className="w-7 h-7 rounded-full bg-sky-600 border border-sky-300 flex items-center justify-center text-xs shadow">
                                        🦅
                                    </div>
                                ))}
                                {playerReserve.length === 0 && (
                                    <span className="text-xs text-sky-400/60 italic">Усі соколи на стежці Мехена!</span>
                                )}
                            </div>
                            {canEnterPlayer && (
                                <button
                                    onClick={() => executeMove(playerReserve[0].id)}
                                    className="w-full py-1.5 bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 text-white text-xs font-bold rounded-lg shadow-md transition animate-pulse"
                                >
                                    Ввести сокола на крок {rollValue}
                                </button>
                            )}
                        </div>

                        {/* Sticks Casting Panel */}
                        <div className="p-3 bg-[#201612] border-2 border-orange-500/50 rounded-xl flex flex-col items-center justify-center gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-orange-300">
                                    {turn === 'player' ? 'Ваш хід' : `Хід: ${opponent.name}`}
                                </span>
                                {extraThrow && (
                                    <span className="px-1.5 py-0.5 bg-orange-500 text-black text-[9px] font-black rounded-full uppercase">
                                        +1 Кидок
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
                                    <div className="text-sm font-bold text-orange-200">
                                        Кроків: <span className="text-xl text-yellow-300 font-extrabold">{rollValue}</span>
                                    </div>
                                ) : (
                                    <button
                                        disabled={turn !== 'player' || isRolling}
                                        onClick={handleCastSticks}
                                        className={`px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-black font-extrabold text-sm rounded-xl shadow-lg transition flex items-center gap-2 ${
                                            turn !== 'player' || isRolling ? 'opacity-50 cursor-not-allowed' : 'animate-bounce'
                                        }`}
                                    >
                                        <span>Кинути 4 Палички</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Player Finished */}
                        <div className="p-3 bg-[#1c1410] border border-orange-500/40 rounded-xl flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs text-orange-300 font-bold">
                                <span>Досягли Голови Мехена</span>
                                <span>{playerFinished.length} / {TOTAL_PIECES}</span>
                            </div>
                            <div className="flex gap-1.5">
                                {playerFinished.map(p => (
                                    <div key={p.id} className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border border-yellow-200 shadow flex items-center justify-center text-xs">
                                        👑
                                    </div>
                                ))}
                            </div>
                            <p className="text-[11px] text-stone-400">
                                Проведіть усіх 4 священних соколів до Голови Змія (36), щоб перемогти!
                            </p>
                        </div>
                    </div>

                    {/* Log */}
                    <div className="bg-[#120c09] border border-orange-500/30 rounded-xl p-3 flex flex-col gap-1 max-h-24 overflow-y-auto text-xs font-mono">
                        <div className="text-[10px] uppercase font-bold text-orange-400/80 mb-0.5">Літопис Мехена:</div>
                        {log.map((entry, idx) => (
                            <div key={idx} className={idx === 0 ? 'text-orange-200 font-semibold' : 'text-stone-400'}>
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
                            <div className="flex justify-between items-center pb-3 border-b border-orange-500/40">
                                <h3 className="text-lg font-bold text-orange-300 flex items-center gap-2">
                                    <span>📜</span> Правила гри Мехен
                                </h3>
                                <button
                                    onClick={() => setShowRules(false)}
                                    className="p-1.5 bg-[#261812] hover:bg-[#382218] rounded-lg text-orange-300 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 py-4 flex flex-col gap-3 leading-relaxed text-stone-300">
                                <p>
                                    <strong className="text-orange-300">Мехен</strong> — священна давньоєгипетська гра епохи Раннього Царства (близько 3000 р. до н.е.), присвячена божественному змієві, що обвиває сонячний човен Ра.
                                </p>
                                <div className="bg-[#1d1410] p-3 rounded-lg border border-orange-500/30 flex flex-col gap-1.5">
                                    <h4 className="font-bold text-orange-300">🪵 Палички долі:</h4>
                                    <p>Кидаються 4 палички (світла чи темна сторона). Кількість світлих сторін визначає рух (1, 2, 3, 4). Якщо всі темні — це 5 кроків! Додатковий кидок надає попадання на бонусну клітинку ⚡ Кільце Урея.</p>
                                </div>
                                <div className="bg-[#1d1410] p-3 rounded-lg border border-orange-500/30 flex flex-col gap-1.5">
                                    <h4 className="font-bold text-orange-300">🌀 Спіраль і пастки:</h4>
                                    <p>Фішки рухаються від хвоста змія (1) концентричними кільцями до Голови (36). На шляху трапляються особливі клітинки: ⚡ Кільце Урея (+2 вперед та бонусний кидок!), 🐍 Пастка Апопа (-2 назад), а також безпечні зони 💧, ☀️, ⚖️.</p>
                                </div>
                                <div className="bg-[#1d1410] p-3 rounded-lg border border-orange-500/30 flex flex-col gap-1.5">
                                    <h4 className="font-bold text-orange-300">⚔️ Збиття:</h4>
                                    <p>Якщо фішка стає на незахищену клітинку з поодинокою фішкою суперника — ворожа фішка відкидається на 3 кроки назад по спіралі!</p>
                                </div>
                                <div className="bg-[#1d1410] p-3 rounded-lg border border-orange-500/30 flex flex-col gap-1.5">
                                    <h4 className="font-bold text-orange-300">👑 Перемога:</h4>
                                    <p>Хто першим доведе всіх своїх 4 соколів до Голови Змія (36), здобуває вічну славу фараонів!</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowRules(false)}
                                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold rounded-xl shadow-lg hover:brightness-110 transition"
                            >
                                До священної спіралі!
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Victory / Defeat Modal */}
                <AnimatePresence>
                    {gameResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md bg-[#18110e] border-2 border-orange-500 rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl gap-4">
                                <div className="w-16 h-16 rounded-full bg-orange-500/20 border-2 border-orange-400 flex items-center justify-center text-3xl">
                                    {gameResult === 'victory' ? '👑' : '🐍'}
                                </div>

                                <div>
                                    <h3 className={`text-2xl font-black ${gameResult === 'victory' ? 'text-orange-300' : 'text-rose-400'}`}>
                                        {gameResult === 'victory' ? 'Перемога у Грі Мехен!' : 'Поразка у кільцях Мехена'}
                                    </h3>
                                    <p className="text-sm text-stone-300 mt-1">
                                        {gameResult === 'victory'
                                            ? `Ваші священні соколи першими досягли Голови Змія Мехена перед ${opponent.name}!`
                                            : `${opponent.name} зумів першим провести своїх вартових крізь кільця змія.`}
                                    </p>
                                </div>

                                {gameResult === 'victory' && (
                                    <div className="w-full bg-[#241712] border border-orange-500/40 rounded-xl p-3 flex justify-around text-xs font-bold text-orange-200">
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
                                            setPieces(initialMehenPieces());
                                            setTurn('player');
                                            setRollValue(null);
                                            setGameResult(null);
                                            setLog(['Партія скинута. Ваш хід!']);
                                        }}
                                        className="flex-1 py-3 bg-[#2c1b14] hover:bg-[#3d271c] text-orange-300 border border-orange-500/50 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-sm"
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
                                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-black font-extrabold rounded-xl shadow-lg transition text-sm"
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

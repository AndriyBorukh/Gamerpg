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
    Sun,
    Flame,
    Eye
} from 'lucide-react';

interface SenetModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

export type SenetPlayer = 'player' | 'opponent';

export interface SenetPiece {
    id: string;
    owner: SenetPlayer;
    position: number; // 1 to 30, or 31 (borne off)
}

const SPECIAL_HOUSES: Record<number, { name: string; symbol: string; desc: string; icon: string }> = {
    15: { name: 'Дім Відродження', symbol: '☥', desc: 'Священне місце воскресіння.', icon: '☥' },
    26: { name: 'Дім Краси', symbol: '𓄤', desc: 'Притулок щастя. Захищений від атак.', icon: '✨' },
    27: { name: 'Дім Води (Ніл)', symbol: '𓈗', desc: 'Пастка! Повертає фішку в Дім Відродження (15).', icon: '🌊' },
    28: { name: 'Дім Трьох Істин', symbol: '𓅓', desc: 'Потрібно рівно 3 для виходу.', icon: '⚖️' },
    29: { name: 'Дім Ре-Атума', symbol: '𓁛', desc: 'Потрібно рівно 2 для виходу.', icon: '☀️' },
    30: { name: 'Дім Гора (Вихід)', symbol: '𓅃', desc: 'Фінальний крок у вічність (потрібно 1).', icon: '🦅' }
};

export function initialPieces(): SenetPiece[] {
    const pieces: SenetPiece[] = [];
    // Alternating positions 1 to 10
    for (let i = 1; i <= 5; i++) {
        pieces.push({ id: `opp_${i}`, owner: 'opponent', position: (i - 1) * 2 + 1 });
        pieces.push({ id: `ply_${i}`, owner: 'player', position: i * 2 });
    }
    return pieces;
}

// Convert 1..30 linear path to grid (row 0..2, col 0..9)
export function getGridCoords(pos: number): { r: number; c: number } {
    if (pos <= 10) {
        return { r: 0, c: pos - 1 }; // Row 1: 1 -> 10
    } else if (pos <= 20) {
        return { r: 1, c: 20 - pos }; // Row 2: 20 <- 11
    } else {
        return { r: 2, c: pos - 21 }; // Row 3: 21 -> 30
    }
}

export default function SenetModal({
    expectedXpReward,
    isOpen,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: SenetModalProps) {
    const [pieces, setPieces] = useState<SenetPiece[]>(initialPieces());
    const [currentTurn, setCurrentTurn] = useState<SenetPlayer>('player');
    const [sticks, setSticks] = useState<boolean[]>([true, false, true, false]); // true = light, false = dark
    const [rollValue, setRollValue] = useState<number | null>(null);
    const [extraThrow, setExtraThrow] = useState<boolean>(false);
    const [isCasting, setIsCasting] = useState<boolean>(false);
    const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);
    const [log, setLog] = useState<string[]>([]);

    const playTone = (type: 'cast' | 'move' | 'swap' | 'water' | 'bear_off' | 'win' | 'lose') => {
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
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'move') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(550, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'swap') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                osc.start();
                osc.stop(ctx.currentTime + 0.12);
            } else if (type === 'water') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);
                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'bear_off') {
                [659, 880, 1174].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);
                    o.start(ctx.currentTime + i * 0.08);
                    o.stop(ctx.currentTime + i * 0.08 + 0.2);
                });
            } else if (type === 'win') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.35);
                    o.start(ctx.currentTime + i * 0.1);
                    o.stop(ctx.currentTime + i * 0.1 + 0.35);
                });
            }
        } catch {}
    };

    const addLog = (msg: string) => setLog(prev => [msg, ...prev.slice(0, 20)]);

    const startNewGame = () => {
        setPieces(initialPieces());
        setCurrentTurn('player');
        setRollValue(null);
        setExtraThrow(false);
        setSelectedPieceId(null);
        setGameResult(null);
        setLog(['🏺 Священний Сенет розпочато! Киньте палички долі, щоб зробити хід.']);
    };

    useEffect(() => {
        if (isOpen) {
            startNewGame();
        }
    }, [isOpen]);

    // Cast 4 sticks
    const castSticks = () => {
        if (isCasting || rollValue !== null || gameResult !== null) return;
        setIsCasting(true);
        playTone('cast');

        setTimeout(() => {
            const s1 = Math.random() > 0.5;
            const s2 = Math.random() > 0.5;
            const s3 = Math.random() > 0.5;
            const s4 = Math.random() > 0.5;
            const newSticks = [s1, s2, s3, s4];
            setSticks(newSticks);

            const lightCount = newSticks.filter(Boolean).length;
            let val = 0;
            let givesBonus = false;

            if (lightCount === 1) {
                val = 1;
                givesBonus = true;
            } else if (lightCount === 2) {
                val = 2;
                givesBonus = false;
            } else if (lightCount === 3) {
                val = 3;
                givesBonus = false;
            } else if (lightCount === 4) {
                val = 4;
                givesBonus = true;
            } else if (lightCount === 0) {
                val = 5;
                givesBonus = true;
            }

            setRollValue(val);
            setExtraThrow(givesBonus);
            setIsCasting(false);

            addLog(`🎲 ${currentTurn === 'player' ? 'Ви кинули' : `${opponent.name} кинув`} палички: ${val} крок(ів)${givesBonus ? ' (+додатковий кидок за 1, 4 або 5!)' : ''}.`);

            // Check if player has any valid moves with this roll
            const valid = getValidMovesForPlayer(pieces, currentTurn, val);
            if (valid.length === 0) {
                addLog(`⚠️ Немає доступних ходів на ${val}. Хід переходить до суперника.`);
                setTimeout(() => {
                    setRollValue(null);
                    setExtraThrow(false);
                    setCurrentTurn(currentTurn === 'player' ? 'opponent' : 'player');
                }, 1000);
            }
        }, 500);
    };

    // Check if target square is protected (2 or more adjacent friendly pieces)
    const isSquareProtected = (allPieces: SenetPiece[], targetPos: number, defender: SenetPlayer): boolean => {
        const hasDefenderPiece = allPieces.some(p => p.position === targetPos && p.owner === defender);
        if (!hasDefenderPiece) return false;

        const hasNeighborBefore = allPieces.some(p => p.position === targetPos - 1 && p.owner === defender);
        const hasNeighborAfter = allPieces.some(p => p.position === targetPos + 1 && p.owner === defender);

        return hasNeighborBefore || hasNeighborAfter;
    };

    // Validate if a piece can move with roll
    const canMovePiece = (allPieces: SenetPiece[], piece: SenetPiece, roll: number): boolean => {
        if (piece.position > 30) return false; // Already borne off

        const targetPos = piece.position + roll;

        // Bearing off rule: from square 26..30
        if (targetPos > 30) {
            // Can only bear off if all pieces have passed row 1 (position >= 15) or simple exit rule
            if (targetPos === 31) return true;
            return false;
        }

        // Check landing square
        const occupant = allPieces.find(p => p.position === targetPos);
        if (occupant) {
            if (occupant.owner === piece.owner) return false; // Cannot land on own piece
            if (targetPos === 26) return false; // House of Beauty is safe haven
            if (isSquareProtected(allPieces, targetPos, occupant.owner)) return false; // Protected block
        }

        return true;
    };

    // Find all pieces that have legal moves
    const getValidMovesForPlayer = (allPieces: SenetPiece[], player: SenetPlayer, roll: number): SenetPiece[] => {
        return allPieces.filter(p => p.owner === player && canMovePiece(allPieces, p, roll));
    };

    // Execute Move
    const executeMove = (pieceId: string) => {
        if (rollValue === null) return;

        const piece = pieces.find(p => p.id === pieceId);
        if (!piece || !canMovePiece(pieces, piece, rollValue)) return;

        const targetPos = piece.position + rollValue;
        let newPieces = [...pieces];

        if (targetPos >= 31) {
            // Bear off!
            newPieces = newPieces.map(p => p.id === pieceId ? { ...p, position: 31 } : p);
            playTone('bear_off');
            addLog(`✨ ${piece.owner === 'player' ? 'Ваша фішка' : `Фішка ${opponent.name}`} покинула дошку у Вічність!`);
        } else {
            // Check for landing on opponent (SWAP)
            const occupant = newPieces.find(p => p.position === targetPos);
            if (occupant && occupant.owner !== piece.owner) {
                // Swap places!
                newPieces = newPieces.map(p => {
                    if (p.id === pieceId) return { ...p, position: targetPos };
                    if (p.id === occupant.id) return { ...p, position: piece.position };
                    return p;
                });
                playTone('swap');
                addLog(`⚔️ Атака! Фішки помінялися місцями (${piece.position} ⇄ ${targetPos}).`);
            } else {
                // Simple move
                newPieces = newPieces.map(p => p.id === pieceId ? { ...p, position: targetPos } : p);
                playTone('move');
                addLog(`🏺 Хід фішкою на клітинку ${targetPos}.`);
            }

            // Trap: House of Water (27)
            if (targetPos === 27) {
                // Find empty square in House of Rebirth (15) or nearest before it
                let rebirthPos = 15;
                while (newPieces.some(p => p.position === rebirthPos) && rebirthPos > 1) {
                    rebirthPos -= 1;
                }
                newPieces = newPieces.map(p => p.id === pieceId ? { ...p, position: rebirthPos } : p);
                playTone('water');
                addLog(`🌊 Пастка Дому Води! Фішку змило назад у Дім Відродження (${rebirthPos}).`);
            }
        }

        setPieces(newPieces);
        setSelectedPieceId(null);

        // Check Victory: All 5 pieces borne off (position 31)
        const playerRemaining = newPieces.filter(p => p.owner === 'player' && p.position <= 30).length;
        const oppRemaining = newPieces.filter(p => p.owner === 'opponent' && p.position <= 30).length;

        if (playerRemaining === 0) {
            setGameResult('victory');
            playTone('win');
            addLog(`👑 СВЯЩЕННИЙ ТРІУМФ! Ви провели всі 5 фішок у Вічність!`);
            return;
        } else if (oppRemaining === 0) {
            setGameResult('defeat');
            addLog(`💀 ПОРАЗКА! ${opponent.name} першим вивів усі фішки.`);
            return;
        }

        const landedOnHouseOfBeauty = targetPos === 26;
        if (landedOnHouseOfBeauty) {
            addLog(`🌺 Дім Краси! Священний прихисток дарує ${piece.owner === 'player' ? 'вам' : opponent.name} додатковий кидок!`);
        }

        // Handle Extra throw (from 1, 4, 5 or House of Beauty) or pass turn
        if (extraThrow || landedOnHouseOfBeauty) {
            setRollValue(null);
            setExtraThrow(false);
            addLog(`✨ Додатковий кидок для ${currentTurn === 'player' ? 'вас' : opponent.name}!`);
        } else {
            setRollValue(null);
            setExtraThrow(false);
            setCurrentTurn(currentTurn === 'player' ? 'opponent' : 'player');
        }
    };

    // AI Turn Execution
    useEffect(() => {
        if (currentTurn !== 'opponent' || gameResult !== null) return;

        const aiTimer = setTimeout(() => {
            if (rollValue === null) {
                // AI Casts sticks
                castSticks();
            } else {
                // AI picks best move
                const validMoves = getValidMovesForPlayer(pieces, 'opponent', rollValue);
                if (validMoves.length > 0) {
                    // Prioritize bearing off, then swapping attacks, then advancing farthest
                    validMoves.sort((a, b) => {
                        const aBears = (a.position + rollValue) >= 31 ? 1 : 0;
                        const bBears = (b.position + rollValue) >= 31 ? 1 : 0;
                        if (aBears !== bBears) return bBears - aBears;

                        const aSwaps = pieces.some(p => p.position === (a.position + rollValue) && p.owner === 'player') ? 1 : 0;
                        const bSwaps = pieces.some(p => p.position === (b.position + rollValue) && p.owner === 'player') ? 1 : 0;
                        if (aSwaps !== bSwaps) return bSwaps - aSwaps;

                        return b.position - a.position;
                    });

                    executeMove(validMoves[0].id);
                }
            }
        }, 900);

        return () => clearTimeout(aiTimer);
    }, [currentTurn, rollValue, pieces, gameResult]);

    if (!isOpen) return null;

    const playerBorneOff = pieces.filter(p => p.owner === 'player' && p.position === 31).length;
    const oppBorneOff = pieces.filter(p => p.owner === 'opponent' && p.position === 31).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="relative w-full max-w-5xl h-[94vh] bg-[#1c150c] border-2 border-amber-600/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header */}
                <div className="px-4 py-2.5 bg-[#291e12] border-b border-amber-600/40 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl p-1.5 rounded-lg bg-[#140e0b] border border-amber-500/40">
                            🏺
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-serif font-black text-sm sm:text-base text-amber-300">
                                    Сенет — Священна гра фараонів (Senet)
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                                    {tavernName}
                                </span>
                            </div>
                            <p className="text-xs text-stone-400">
                                Жрець/Суперник: <strong className="text-stone-200">{opponent.name}</strong> ({opponent.title})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-1.5 rounded-lg bg-[#140e0b] hover:bg-[#2b1f16] border border-stone-700 text-stone-300 transition-colors"
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                        </button>
                        <button
                            onClick={() => setShowRules(true)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#140e0b] hover:bg-[#2b1f16] border border-amber-500/40 text-xs font-bold text-amber-300 transition-colors cursor-pointer"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Правила</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-[#140e0b] hover:bg-rose-950/60 border border-stone-700 hover:border-rose-500/50 text-stone-300 hover:text-rose-300 transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Senet Board Arena */}
                <div className="flex-1 p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#382613] via-[#21150a] to-[#120b05] flex flex-col justify-between overflow-y-auto space-y-3">
                    {/* Top Status Bar: Opponent & Borne Off pieces */}
                    <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-black/40 border border-amber-700/40">
                        <div className="flex items-center gap-3">
                            <div className="text-xl p-1 rounded-full bg-stone-900 border border-amber-500/30">
                                {opponent.avatar}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-stone-200">{opponent.name} (Око Гора)</div>
                                <div className="text-[11px] text-stone-400">Виведено у Вічність: <strong className="text-amber-300">{oppBorneOff} / 5</strong></div>
                            </div>
                        </div>

                        {/* Opponent Borne Off Icons */}
                        <div className="flex gap-1">
                            {Array(5).fill(0).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                                        i < oppBorneOff ? 'bg-amber-900 border-amber-500 text-amber-300 shadow' : 'bg-black/30 border-stone-800 text-stone-700'
                                    }`}
                                >
                                    𓂀
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 30-Square Senet Track (3 Rows of 10) */}
                    <div className="p-3 rounded-2xl bg-[#4a3219] border-4 border-[#6b4724] shadow-2xl flex flex-col gap-2">
                        {[0, 1, 2].map((rowIndex) => (
                            <div key={rowIndex} className="grid grid-cols-10 gap-1.5 sm:gap-2">
                                {Array(10).fill(0).map((_, colIndex) => {
                                    // Calculate 1..30 path index
                                    let pos = 1;
                                    if (rowIndex === 0) pos = colIndex + 1; // 1 -> 10
                                    else if (rowIndex === 1) pos = 20 - colIndex; // 20 <- 11
                                    else pos = 21 + colIndex; // 21 -> 30

                                    const piece = pieces.find(p => p.position === pos);
                                    const special = SPECIAL_HOUSES[pos];
                                    const isSelectable = currentTurn === 'player' && rollValue !== null && piece?.owner === 'player' && canMovePiece(pieces, piece, rollValue);

                                    return (
                                        <div
                                            key={pos}
                                            onClick={() => {
                                                if (isSelectable && piece) {
                                                    executeMove(piece.id);
                                                }
                                            }}
                                            className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-between p-1 select-none transition-all ${
                                                isSelectable 
                                                    ? 'cursor-pointer border-emerald-400 ring-4 ring-emerald-400/50 bg-[#634524]' 
                                                    : 'border-[#301e0e] bg-[#3a2512]'
                                            } ${special ? 'bg-[#52351b] border-amber-500/70 shadow-inner' : ''}`}
                                        >
                                            {/* Square Number */}
                                            <div className="w-full flex items-center justify-between text-[8px] sm:text-[9px] text-amber-200/70 font-mono">
                                                <span>#{pos}</span>
                                                {special && <span className="text-[10px]">{special.icon}</span>}
                                            </div>

                                            {/* Piece (if on square) */}
                                            {piece && (
                                                <motion.div
                                                    layout
                                                    whileHover={{ scale: piece.owner === 'player' ? 1.15 : 1 }}
                                                    className={`w-7 sm:w-10 h-7 sm:h-10 rounded-full border-2 shadow-lg flex items-center justify-center text-sm sm:text-base font-black ${
                                                        piece.owner === 'player'
                                                            ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-amber-200 text-stone-900 shadow-yellow-500/40 ring-1 ring-amber-300'
                                                            : 'bg-gradient-to-br from-stone-900 via-stone-800 to-black border-amber-600 text-amber-400'
                                                    }`}
                                                >
                                                    {piece.owner === 'player' ? '☥' : '𓂀'}
                                                </motion.div>
                                            )}

                                            {/* Special Name tag */}
                                            {special && (
                                                <div className="text-[7px] text-amber-300 truncate w-full text-center leading-none">
                                                    {special.symbol}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Bottom Area: Sticks & Casting Controls + Player Info */}
                    <div className="p-4 rounded-2xl bg-black/50 border-2 border-amber-500/60 backdrop-blur-sm space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            {/* Player Info */}
                            <div className="flex items-center gap-3">
                                <div className="text-xl p-1 rounded-full bg-stone-900 border border-amber-500/40">
                                    🧑‍🌾
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-amber-300">Ви (Знак Анкха ☥)</div>
                                    <div className="text-[11px] text-stone-300">Виведено у Вічність: <strong className="text-yellow-400">{playerBorneOff} / 5</strong></div>
                                </div>
                            </div>

                            {/* 4 Casting Sticks View */}
                            <div className="flex items-center gap-2 bg-[#25180c] px-3 py-1.5 rounded-xl border border-amber-600/40">
                                <span className="text-xs text-stone-300 mr-1 font-bold">Палички:</span>
                                {sticks.map((isLight, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-4 h-10 rounded-sm border-2 shadow transition-transform ${
                                            isLight 
                                                ? 'bg-[#f7dfb8] border-amber-400 shadow-yellow-500/30' 
                                                : 'bg-[#2b1709] border-[#5e3717]'
                                        }`}
                                        title={isLight ? 'Світла сторона' : 'Темна сторона'}
                                    />
                                ))}

                                {rollValue !== null && (
                                    <div className="ml-2 px-2 py-0.5 rounded bg-amber-500 text-black font-black text-xs">
                                        ={rollValue} {extraThrow && '+ БОНУС'}
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            {currentTurn === 'player' && rollValue === null && (
                                <button
                                    onClick={castSticks}
                                    disabled={isCasting}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer flex items-center gap-2"
                                >
                                    <Sun className="w-4 h-4" />
                                    <span>{isCasting ? 'Кидаємо...' : 'КИНУТИ ПАЛИЧКИ!'}</span>
                                </button>
                            )}

                            {currentTurn === 'player' && rollValue !== null && (
                                <div className="text-xs text-emerald-300 font-bold animate-pulse">
                                    Клацніть по вашій підсвіченій фішці для ходу на {rollValue} крок(ів)!
                                </div>
                            )}

                            {currentTurn === 'opponent' && (
                                <div className="text-xs text-stone-400 italic">
                                    {opponent.name} обдумує волю богів...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Victory / Defeat Modal */}
                <AnimatePresence>
                    {gameResult !== null && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-md p-6 rounded-2xl bg-[#1a140f] border-2 border-amber-500/80 shadow-2xl text-center space-y-4"
                            >
                                {gameResult === 'victory' ? (
                                    <>
                                        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center text-3xl shadow animate-bounce">
                                            🏺
                                        </div>
                                        <h2 className="text-2xl font-serif font-black text-amber-300">
                                            БЛАГОСЛОВЕННЯ ОСІРІСА!
                                        </h2>
                                        <p className="text-sm text-[#f5ebd7]">
                                            Ви першим провели всі фішки через 30 клітинок у вічність і здолали {opponent.name}!
                                        </p>
                                        <div className="p-3 rounded-xl bg-[#241a12] border border-amber-500/40 flex items-center justify-around text-xs font-bold text-amber-300">
                                            <div className="flex items-center gap-1.5">
                                                <Coins className="w-4 h-4 text-amber-400" />
                                                <span>+{opponent.rewards.gold} золота</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-emerald-400">
                                                <Sparkles className="w-4 h-4" />
                                                <span>+{(expectedXpReward ?? (opponent.rewards.xp || 130))} XP</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                onVictory();
                                                onClose();
                                            }}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-sm shadow-lg cursor-pointer"
                                        >
                                            Забрати виграш та вийти
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-3xl shadow">
                                            💀
                                        </div>
                                        <h2 className="text-2xl font-serif font-black text-rose-400">
                                            ПОРАЗКА В СЕНЕТІ!
                                        </h2>
                                        <p className="text-sm text-[#f5ebd7]">
                                            {opponent.name}: «Боги сьогодні обрали мене!»
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={startNewGame}
                                                className="flex-1 py-3 rounded-xl bg-[#2e2118] hover:bg-[#3d2c20] border border-amber-500/50 text-amber-300 font-black text-sm cursor-pointer"
                                            >
                                                Реванш
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onDefeat();
                                                    onClose();
                                                }}
                                                className="px-5 py-3 rounded-xl bg-stone-800 text-stone-300 font-bold text-sm cursor-pointer"
                                            >
                                                Вийти
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Rules Modal */}
                <AnimatePresence>
                    {showRules && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full max-w-lg p-5 rounded-2xl bg-[#1a140f] border-2 border-amber-500/70 shadow-2xl space-y-3 text-xs text-[#e8dac7]"
                            >
                                <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                                    <h3 className="text-base font-serif font-black text-amber-300">
                                        Правила гри Сенет (30 клітинок)
                                    </h3>
                                    <button
                                        onClick={() => setShowRules(false)}
                                        className="p-1 rounded-lg bg-stone-800 text-stone-300 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                                    <p><strong>1. Дошка:</strong> 30 клітинок, розташованих змійкою у 3 ряди (1-10 праворуч, 11-20 ліворуч, 21-30 праворуч).</p>
                                    <p><strong>2. Палички:</strong> 4 двосторонні палички дають очки (1 світла = 1+бонус, 2 = 2, 3 = 3, 4 світлі = 4+бонус, 0 світлих = 5+бонус).</p>
                                    <p><strong>3. Атака та захист:</strong> При попаданні на одиночну фішку ворога фішки міняються місцями! Дві або більше дружні фішки поруч захищені від атаки.</p>
                                    <p><strong>4. Дім Води (#27):</strong> Пастка, яка повертає фішку назад у Дім Відродження (#15).</p>
                                    <p><strong>5. Мета:</strong> Першим вивести всі 5 фішок за межі клітинки #30.</p>
                                </div>
                                <button
                                    onClick={() => setShowRules(false)}
                                    className="w-full py-2 rounded-xl bg-amber-500 text-black font-black cursor-pointer"
                                >
                                    Зрозуміло
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

import { useState, useEffect, useCallback, useRef } from 'react';
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
    Shield,
    Swords,
    ChevronRight,
    Crown,
    Eye
} from 'lucide-react';

interface UrModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

export type UrPlayer = 'player' | 'opponent';

export interface UrPiece {
    id: string;
    owner: UrPlayer;
    step: number; // 0 = in reserve, 1..14 = on board, 15 = borne off
}

// 14 steps for each player along the British Museum Irving Finkel path
export const PLAYER_PATH: { r: number; c: number }[] = [
    { r: 0, c: 3 }, // Step 1: Start
    { r: 0, c: 2 }, // Step 2: Eyes
    { r: 0, c: 1 }, // Step 3: Dots
    { r: 0, c: 0 }, // Step 4: Rosette 1
    { r: 1, c: 0 }, // Step 5: Turn into central combat lane
    { r: 1, c: 1 }, // Step 6
    { r: 1, c: 2 }, // Step 7
    { r: 1, c: 3 }, // Step 8: Rosette 2 (Central Sanctuary: Safe from capture!)
    { r: 1, c: 4 }, // Step 9: Bridge (Horn of Plenty / Vase)
    { r: 1, c: 5 }, // Step 10: Bridge
    { r: 1, c: 6 }, // Step 11
    { r: 1, c: 7 }, // Step 12: End of central combat lane
    { r: 0, c: 7 }, // Step 13: Turn into private exit lane
    { r: 0, c: 6 }, // Step 14: Rosette 3
    // Step 15 = Borne off (requires exact roll from on-board position)
];

export const OPPONENT_PATH: { r: number; c: number }[] = [
    { r: 2, c: 3 }, // Step 1: Start
    { r: 2, c: 2 }, // Step 2: Eyes
    { r: 2, c: 1 }, // Step 3: Dots
    { r: 2, c: 0 }, // Step 4: Rosette 1
    { r: 1, c: 0 }, // Step 5: Turn into central combat lane
    { r: 1, c: 1 }, // Step 6
    { r: 1, c: 2 }, // Step 7
    { r: 1, c: 3 }, // Step 8: Rosette 2 (Central Sanctuary: Safe from capture!)
    { r: 1, c: 4 }, // Step 9: Bridge (Horn of Plenty / Vase)
    { r: 1, c: 5 }, // Step 10: Bridge
    { r: 1, c: 6 }, // Step 11
    { r: 1, c: 7 }, // Step 12: End of central combat lane
    { r: 2, c: 7 }, // Step 13: Turn into private exit lane
    { r: 2, c: 6 }, // Step 14: Rosette 3
];

// The 5 canonical Rosette coordinates on the Ur board
export const ROSETTE_COORDS = [
    { r: 0, c: 0 }, // Player home corner (step 4)
    { r: 2, c: 0 }, // Opponent home corner (step 4)
    { r: 1, c: 3 }, // Central Sanctuary (step 8 for both)
    { r: 0, c: 6 }, // Player exit corner (step 14)
    { r: 2, c: 6 }  // Opponent exit corner (step 14)
];

export function isRosette(r: number, c: number): boolean {
    return ROSETTE_COORDS.some(coord => coord.r === r && coord.c === c);
}

// Canonical piece count according to Irving Finkel / British Museum is 7 pieces
export const TOTAL_PIECES = 7;

export function initialUrPieces(): UrPiece[] {
    const list: UrPiece[] = [];
    for (let i = 1; i <= TOTAL_PIECES; i++) {
        list.push({ id: `p_${i}`, owner: 'player', step: 0 });
        list.push({ id: `o_${i}`, owner: 'opponent', step: 0 });
    }
    return list;
}

export default function UrModal({
    expectedXpReward,
    isOpen,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: UrModalProps) {
    const [pieces, setPieces] = useState<UrPiece[]>(() => initialUrPieces());
    const [turn, setTurn] = useState<UrPlayer>('player');
    const [dice, setDice] = useState<number[]>([0, 0, 0, 0]); // 4 tetrahedral dice (1 = marked tip, 0 = unmarked)
    const [rollValue, setRollValue] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState<boolean>(false);
    const [extraTurn, setExtraTurn] = useState<boolean>(false);
    const [hoveredPieceId, setHoveredPieceId] = useState<string | null>(null);
    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);
    const [log, setLog] = useState<string[]>([
        'Ласкаво просимо до Королівської гри Ур за правилами Ірвінга Фінкеля (Британський музей)!',
        'У кожного по 7 фішок. Киньте 4 тетраедри для ходу.'
    ]);

    // Keep state refs to avoid stale closures in timeouts
    const turnRef = useRef(turn);
    turnRef.current = turn;
    const piecesRef = useRef(pieces);
    piecesRef.current = pieces;
    const rollValueRef = useRef(rollValue);
    rollValueRef.current = rollValue;
    const isRollingRef = useRef(isRolling);
    isRollingRef.current = isRolling;
    const gameResultRef = useRef(gameResult);
    gameResultRef.current = gameResult;

    // Reset game
    const restartGame = useCallback(() => {
        setPieces(initialUrPieces());
        setTurn('player');
        setDice([0, 0, 0, 0]);
        setRollValue(null);
        setIsRolling(false);
        setExtraTurn(false);
        setHoveredPieceId(null);
        setGameResult(null);
        setLog([
            'Нова партія (правила Ірвінга Фінкеля, 7 фішок)! Ваш хід.',
            'Киньте 4 тетраедричні кістки.'
        ]);
    }, []);

    const playTone = useCallback((type: 'roll' | 'move' | 'capture' | 'rosette' | 'bear_off' | 'win' | 'lose') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'roll') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                osc.start();
                osc.stop(ctx.currentTime + 0.12);
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
                osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.22);
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
                [440, 554, 659, 880].forEach((f, i) => {
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
                [320, 270, 220, 170].forEach((f, i) => {
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
            // Audio context not allowed or blocked
        }
    }, [soundEnabled]);

    // Check if a piece can move with the given roll value
    const canMovePiece = useCallback((piece: UrPiece, roll: number): boolean => {
        if (roll <= 0) return false;
        if (piece.step === 15) return false; // Already borne off

        const targetStep = piece.step + roll;
        // Historical Rule: Must bear off with exact count! (targetStep === 15)
        if (targetStep > 15) return false;

        // Bearing off (targetStep === 15) is always allowed if exact count is met
        if (targetStep === 15) return true;

        // Friendly collision: cannot land on your own piece
        const friendlyOccupied = piecesRef.current.some(
            p => p.owner === piece.owner && p.id !== piece.id && p.step === targetStep
        );
        if (friendlyOccupied) return false;

        // Central combat lane (steps 5 to 12)
        if (targetStep >= 5 && targetStep <= 12) {
            const enemyPiece = piecesRef.current.find(
                p => p.owner !== piece.owner && p.step === targetStep
            );
            if (enemyPiece) {
                // Step 8 is the sacred Central Rosette (Refuge/Sanctuary): IMMUNE from capture!
                // Enemy pieces CANNOT land on Step 8 if occupied!
                if (targetStep === 8) {
                    return false;
                }
            }
        }

        return true;
    }, []);

    // Check if a player has any legal moves
    const hasValidMove = useCallback((player: UrPlayer, roll: number): boolean => {
        if (roll <= 0) return false;
        const myPieces = piecesRef.current.filter(p => p.owner === player && p.step < 15);
        return myPieces.some(p => canMovePiece(p, roll));
    }, [canMovePiece]);

    // Roll the 4 tetrahedral dice
    const handleRoll = useCallback(() => {
        if (isRollingRef.current || rollValueRef.current !== null || gameResultRef.current) return;
        setIsRolling(true);
        playTone('roll');

        // Clear any previous extra turn indicator once the roll is in flight
        setExtraTurn(false);

        setTimeout(() => {
            const d1 = Math.random() < 0.5 ? 1 : 0;
            const d2 = Math.random() < 0.5 ? 1 : 0;
            const d3 = Math.random() < 0.5 ? 1 : 0;
            const d4 = Math.random() < 0.5 ? 1 : 0;
            const total = d1 + d2 + d3 + d4;

            setDice([d1, d2, d3, d4]);
            setRollValue(total);
            setIsRolling(false);

            const activePlayer = turnRef.current;
            const playerName = activePlayer === 'player' ? 'Ви' : opponent.name;
            setLog(prev => [`🎲 ${playerName} кидає: ${total} [${d1},${d2},${d3},${d4}]`, ...prev.slice(0, 8)]);

            // Rule: A roll of 0 yields no movement and turn immediately ends
            if (total === 0) {
                setLog(prev => [`❌ Кидок 0! Хід без ходу переходить.`, ...prev.slice(0, 8)]);
                setTimeout(() => {
                    setRollValue(null);
                    setExtraTurn(false);
                    setTurn(activePlayer === 'player' ? 'opponent' : 'player');
                }, 1000);
                return;
            }

            // Check if player has any legal moves
            const hasMoves = hasValidMove(activePlayer, total);
            if (!hasMoves) {
                setLog(prev => [`🚫 Немає доступних ходів на ${total}! Хід переходить.`, ...prev.slice(0, 8)]);
                setTimeout(() => {
                    setRollValue(null);
                    setExtraTurn(false);
                    setTurn(activePlayer === 'player' ? 'opponent' : 'player');
                }, 1100);
            }
        }, 500);
    }, [playTone, opponent.name, hasValidMove]);

    // Execute a move for a specific piece
    const executeMove = useCallback((pieceId: string) => {
        const currentRoll = rollValueRef.current;
        const currentTurn = turnRef.current;
        if (currentRoll === null || currentRoll <= 0 || gameResultRef.current) return;

        const currentPieces = piecesRef.current;
        const piece = currentPieces.find(p => p.id === pieceId);
        if (!piece || piece.owner !== currentTurn) return;
        if (!canMovePiece(piece, currentRoll)) return;

        const targetStep = piece.step + currentRoll;
        let capturedEnemy = false;

        const newPieces = currentPieces.map(p => {
            if (p.id === pieceId) {
                return { ...p, step: targetStep };
            }
            // In shared lane (steps 5..12), capture enemy piece if not on sanctuary (step 8)
            if (targetStep >= 5 && targetStep <= 12 && targetStep !== 8 && p.owner !== currentTurn && p.step === targetStep) {
                capturedEnemy = true;
                return { ...p, step: 0 }; // Knocked back to reserve!
            }
            return p;
        });

        setPieces(newPieces);

        // Rosettes are at step 4 (entry corner), step 8 (sanctuary), and step 14 (exit corner)
        const landedOnRosette = targetStep === 4 || targetStep === 8 || targetStep === 14;

        if (targetStep === 15) {
            playTone('bear_off');
            setLog(prev => [`🌟 ${currentTurn === 'player' ? 'Ваша фішка' : 'Фішка суперника'} дісталася вічності (зійшла з дошки)!`, ...prev.slice(0, 8)]);
        } else if (capturedEnemy) {
            playTone('capture');
            setLog(prev => [`⚔️ ${currentTurn === 'player' ? 'Ви збили' : `${opponent.name} збиває`} ворожу фішку назад у резерв!`, ...prev.slice(0, 8)]);
        } else if (landedOnRosette) {
            playTone('rosette');
            setLog(prev => [`🌺 Священна Розетка! ${currentTurn === 'player' ? 'Ви отримуєте' : `${opponent.name} отримує`} бонусний кидок!`, ...prev.slice(0, 8)]);
        } else {
            playTone('move');
        }

        // Check Victory: all pieces borne off (step === 15)
        const remaining = newPieces.filter(p => p.owner === currentTurn && p.step < 15);
        if (remaining.length === 0) {
            if (currentTurn === 'player') {
                playTone('win');
                setGameResult('victory');
            } else {
                playTone('lose');
                setGameResult('defeat');
            }
            setRollValue(null);
            setExtraTurn(false);
            return;
        }

        // Handle Extra Turn vs Pass Turn:
        // In Irving Finkel rules, ONLY landing precisely on a Rosette grants an extra turn!
        setRollValue(null);
        if (landedOnRosette) {
            setExtraTurn(true);
            // Same player retains turn for bonus roll
        } else {
            setExtraTurn(false);
            setTurn(currentTurn === 'player' ? 'opponent' : 'player');
        }
    }, [canMovePiece, opponent.name, playTone]);

    // AI Turn Automation (Strictly adheres to Irving Finkel rules)
    useEffect(() => {
        if (turn !== 'opponent' || gameResult) return;

        // Step 1: AI rolls dice if awaiting roll
        if (rollValue === null && !isRolling) {
            const rollTimer = setTimeout(() => {
                if (turnRef.current === 'opponent' && rollValueRef.current === null && !isRollingRef.current) {
                    handleRoll();
                }
            }, 800);
            return () => clearTimeout(rollTimer);
        }

        // Step 2: If rolled > 0, evaluate moves and execute best choice
        if (rollValue !== null && rollValue > 0) {
            const oppPieces = pieces.filter(p => p.owner === 'opponent' && p.step < 15);
            const validPieces = oppPieces.filter(p => canMovePiece(p, rollValue));

            if (validPieces.length === 0) {
                // Handled in handleRoll pass-turn timeout
                return;
            }

            const aiTimer = setTimeout(() => {
                if (turnRef.current !== 'opponent' || rollValueRef.current !== rollValue) return;

                // Irving Finkel Ur Heuristic Strategy:
                // 1. Bear off a piece to victory (step 15) -> +200
                // 2. Land on Rosette (step 4, 8, 14) -> +100
                // 3. Capture player's piece in shared lane (steps 5..12) -> +80
                // 4. Move piece out of dangerous capture zone into sanctuary or private exit -> +40
                // 5. Advance furthest piece along track -> +targetStep
                let bestPiece = validPieces[0];
                let bestScore = -999;

                for (const p of validPieces) {
                    const target = p.step + rollValue;
                    let score = target;

                    if (target === 15) {
                        score += 200; // Bear off!
                    } else if (target === 4 || target === 8 || target === 14) {
                        score += 100; // Rosette bonus turn!
                        if (target === 8) score += 40; // Central sanctuary safety
                    } else if (target >= 5 && target <= 12) {
                        const enemyAtTarget = pieces.some(pl => pl.owner === 'player' && pl.step === target);
                        if (enemyAtTarget) {
                            score += 80; // Capture player piece!
                        }
                    }

                    if (p.step >= 5 && p.step <= 12 && p.step !== 8) {
                        const enemyBehind = pieces.some(pl => pl.owner === 'player' && pl.step < p.step && p.step - pl.step <= 4);
                        if (enemyBehind) {
                            score += 30; // Evade capture!
                        }
                    }

                    if (p.step === 0) {
                        score += 15;
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestPiece = p;
                    }
                }

                executeMove(bestPiece.id);
            }, 900);

            return () => clearTimeout(aiTimer);
        }
    }, [turn, rollValue, isRolling, gameResult, pieces, canMovePiece, executeMove, handleRoll]);

    const playerReserve = pieces.filter(p => p.owner === 'player' && p.step === 0);
    const playerBorneOff = pieces.filter(p => p.owner === 'player' && p.step === 15);
    const oppReserve = pieces.filter(p => p.owner === 'opponent' && p.step === 0);
    const oppBorneOff = pieces.filter(p => p.owner === 'opponent' && p.step === 15);

    const canEnterPlayer = playerReserve.length > 0 && rollValue !== null && rollValue > 0 && canMovePiece(playerReserve[0], rollValue);

    const getTargetStepForHover = (pieceId: string | null): number | null => {
        if (!pieceId || rollValue === null || rollValue <= 0) return null;
        const p = pieces.find(x => x.id === pieceId);
        if (!p || !canMovePiece(p, rollValue)) return null;
        return p.step + rollValue;
    };

    const hoveredTargetStep = getTargetStepForHover(hoveredPieceId);

    // Board cell rendering helper for the classic 3x8 Ur board
    const renderCell = (r: number, c: number) => {
        // Cutouts in the Royal Game of Ur board
        const isCutout = (r === 0 || r === 2) && (c === 4 || c === 5);
        if (isCutout) {
            return (
                <div key={`cell-${r}-${c}`} className="w-10 h-10 sm:w-14 sm:h-14 opacity-0 pointer-events-none" />
            );
        }

        const isRos = isRosette(r, c);
        const isSanctuary = r === 1 && c === 3;
        const isEyes = (r === 0 || r === 2) && c === 2;
        const isDots = (r === 0 || r === 2) && c === 1;
        const isCornucopia = r === 1 && c === 4; // Bridge tile with sacred horn/vase

        const playerPieceOnCell = pieces.find(p => {
            if (p.owner !== 'player' || p.step === 0 || p.step === 15) return false;
            const coord = PLAYER_PATH[p.step - 1];
            return coord.r === r && coord.c === c;
        });

        const oppPieceOnCell = pieces.find(p => {
            if (p.owner !== 'opponent' || p.step === 0 || p.step === 15) return false;
            const coord = OPPONENT_PATH[p.step - 1];
            return coord.r === r && coord.c === c;
        });

        const activePiece = playerPieceOnCell || oppPieceOnCell;
        const isPlayerPieceMovable = playerPieceOnCell && turn === 'player' && rollValue !== null && canMovePiece(playerPieceOnCell, rollValue);

        let isTargetOfHover = false;
        if (hoveredTargetStep !== null && hoveredTargetStep <= 14) {
            const targetCoord = PLAYER_PATH[hoveredTargetStep - 1];
            if (targetCoord.r === r && targetCoord.c === c) {
                isTargetOfHover = true;
            }
        }

        return (
            <motion.div
                key={`cell-${r}-${c}`}
                whileHover={isPlayerPieceMovable ? { scale: 1.06 } : undefined}
                onMouseEnter={() => {
                    if (isPlayerPieceMovable && playerPieceOnCell) {
                        setHoveredPieceId(playerPieceOnCell.id);
                    }
                }}
                onMouseLeave={() => {
                    if (hoveredPieceId === playerPieceOnCell?.id) {
                        setHoveredPieceId(null);
                    }
                }}
                onClick={() => {
                    if (isPlayerPieceMovable && playerPieceOnCell) {
                        executeMove(playerPieceOnCell.id);
                    }
                }}
                className={`relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center transition-all select-none shadow-md ${
                    isRos
                        ? 'bg-gradient-to-br from-amber-900/90 via-yellow-950/70 to-amber-950 border-amber-400 shadow-amber-500/40'
                        : isCornucopia
                        ? 'bg-gradient-to-br from-yellow-950/80 via-amber-950 to-[#221813] border-yellow-500/70'
                        : r === 1
                        ? 'bg-[#1e1713] border-[#7d5d36]/70'
                        : r === 0
                        ? 'bg-[#181d26] border-sky-600/50'
                        : 'bg-[#241718] border-rose-700/50'
                } ${isPlayerPieceMovable ? 'ring-2 ring-yellow-400 cursor-pointer shadow-yellow-500/50 animate-pulse' : ''} ${
                    isTargetOfHover ? 'ring-2 ring-emerald-400 bg-emerald-950/40 shadow-emerald-500/40' : ''
                }`}
            >
                {/* 1. 8-petal Rosette */}
                {isRos && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                        <svg viewBox="0 0 100 100" className="w-7 h-7 sm:w-10 sm:h-10 text-amber-300 fill-current">
                            <circle cx="50" cy="50" r="10" />
                            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
                                <ellipse key={idx} cx="50" cy="24" rx="6" ry="16" transform={`rotate(${angle} 50 50)`} />
                            ))}
                        </svg>
                    </div>
                )}

                {/* 2. Ріг Достатку / Священна амфора на мосту */}
                {isCornucopia && !isRos && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 pointer-events-none">
                        <span className="text-sm sm:text-base">🏺</span>
                    </div>
                )}

                {/* 3. Ока Мудрості */}
                {isEyes && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none text-amber-200">
                        <Eye className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                )}

                {/* 4. П'ять Сфер Достатку */}
                {isDots && (
                    <div className="absolute inset-0 grid grid-cols-2 p-1.5 sm:p-2 gap-1 pointer-events-none opacity-25">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400" />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 justify-self-end" />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400" />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 justify-self-end" />
                    </div>
                )}

                {/* Sanctuary Rosette badge */}
                {isSanctuary && (
                    <div className="absolute -top-2 px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[7px] sm:text-[8px] font-black rounded-full uppercase tracking-tight shadow-md flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        <span>Святилище</span>
                    </div>
                )}

                {/* Corner Rosette Indicator */}
                {isRos && !isSanctuary && (
                    <div className="absolute -top-1.5 px-1 bg-amber-500/90 text-black text-[7px] font-bold rounded-full uppercase">
                        +1 хід
                    </div>
                )}

                {/* Target Destination Indicator on Hover */}
                {isTargetOfHover && !activePiece && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                )}

                {/* Piece on cell */}
                {activePiece && (
                    <motion.div
                        layoutId={`piece-${activePiece.id}`}
                        className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs sm:text-sm shadow-xl ${
                            activePiece.owner === 'player'
                                ? 'bg-gradient-to-b from-sky-400 via-blue-600 to-blue-900 border-sky-200 text-white shadow-blue-500/50'
                                : 'bg-gradient-to-b from-rose-400 via-red-600 to-red-950 border-rose-200 text-white shadow-red-500/50'
                        }`}
                    >
                        {activePiece.owner === 'player' ? (
                            <span className="drop-shadow-md">🔵</span>
                        ) : (
                            <span className="drop-shadow-md">🔴</span>
                        )}
                    </motion.div>
                )}
            </motion.div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="relative w-full max-w-4xl max-h-[96vh] bg-[#120f0d] border-2 border-[#b8860b] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header */}
                <div className="px-4 py-3 bg-[#1c1612] border-b border-[#b8860b]/40 flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-2xl sm:text-3xl">🏺</span>
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-1.5">
                                Королівська гра Ур (Irving Finkel, Британський музей)
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-200 font-normal">
                                    7 фішок • 4 тетраедри
                                </span>
                            </h2>
                            <p className="text-xs text-amber-200/70">
                                {tavernName} • Суперник: <span className="text-white font-semibold">{opponent.name}</span> ({opponent.title})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-2 bg-[#251d16] hover:bg-[#34271c] border border-[#b8860b]/40 rounded-lg text-amber-300 transition cursor-pointer"
                            title={soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="p-2 bg-[#251d16] hover:bg-[#34271c] border border-[#b8860b]/40 rounded-lg text-amber-300 transition cursor-pointer"
                            title="Правила гри за Ірвінгом Фінкелем"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 bg-[#251d16] hover:bg-[#34271c] border border-[#b8860b]/40 rounded-lg text-amber-300 hover:text-white transition cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-3 sm:gap-4">
                    {/* Opponent Status Header */}
                    <div className="flex items-center justify-between bg-[#191410] border border-[#b8860b]/30 rounded-xl p-2.5 sm:p-3">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl sm:text-4xl">{opponent.avatar}</span>
                            <div>
                                <div className="text-sm sm:text-base font-bold text-rose-300 flex items-center gap-1.5">
                                    <span>{opponent.name}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 font-normal">
                                        Складність: {opponent.difficulty}
                                    </span>
                                </div>
                                <p className="text-xs text-stone-400 italic">«{opponent.flavorQuote}»</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-stone-400 uppercase tracking-wider">Виведено у вічність</span>
                                <div className="flex items-center gap-1 text-rose-400 font-bold text-sm sm:text-base">
                                    <Trophy className="w-4 h-4" />
                                    <span>{oppBorneOff.length} / {TOTAL_PIECES}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Royal Game of Ur Board (8 columns x 3 rows) */}
                    <div className="flex flex-col items-center justify-center p-3 sm:p-5 bg-gradient-to-b from-[#1a1410] to-[#120f0d] border border-[#b8860b]/50 rounded-2xl shadow-inner relative">
                        {/* Board Grid: 8 columns x 3 rows */}
                        <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                            {/* Row 0: Player's private start & exit lane */}
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(c => renderCell(0, c))}
                            {/* Row 1: Central shared battle lane */}
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(c => renderCell(1, c))}
                            {/* Row 2: Opponent's private start & exit lane */}
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(c => renderCell(2, c))}
                        </div>

                        {/* Lane navigation hints */}
                        <div className="w-full flex justify-between items-center text-[10px] text-amber-400/70 px-2 mt-3 font-medium">
                            <span className="flex items-center gap-1">← Вхід (Верх: Ви, Низ: Суперник)</span>
                            <span className="text-amber-300 font-semibold flex items-center gap-1">
                                <Swords className="w-3 h-3 text-amber-400" />
                                Спільна битва (збиття ворогів, крім Святилища на 8 кроці)
                            </span>
                            <span className="flex items-center gap-1">Вихід у Вічність →</span>
                        </div>
                    </div>

                    {/* Reserves & Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        {/* Player Reserve & Entry Button */}
                        <div className="p-3 bg-[#181e26] border border-sky-500/40 rounded-xl flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs text-sky-300 font-bold">
                                <span>Ваш резерв ({playerReserve.length} / {TOTAL_PIECES})</span>
                                <span>У грі: {TOTAL_PIECES - playerReserve.length - playerBorneOff.length}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                                {playerReserve.map(p => (
                                    <div
                                        key={p.id}
                                        onMouseEnter={() => canEnterPlayer && setHoveredPieceId(p.id)}
                                        onMouseLeave={() => setHoveredPieceId(null)}
                                        className="w-6 h-6 rounded-full bg-blue-600 border border-sky-300 shadow-sm flex items-center justify-center text-[10px]"
                                    >
                                        🔵
                                    </div>
                                ))}
                                {playerReserve.length === 0 && (
                                    <span className="text-xs text-sky-400/60 italic">Всі ваші фішки введені на поле!</span>
                                )}
                            </div>
                            {canEnterPlayer && (
                                <button
                                    onClick={() => executeMove(playerReserve[0].id)}
                                    className="w-full py-1.5 bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 text-white text-xs font-bold rounded-lg shadow-md transition animate-pulse flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <span>Ввести фішку на крок {rollValue}</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Center: Dice Rolling Panel (4 Tetrahedral Dice) */}
                        <div className="p-3 bg-[#1e1712] border-2 border-amber-500/50 rounded-xl flex flex-col items-center justify-center gap-2">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${turn === 'player' ? 'text-amber-300' : 'text-rose-300'}`}>
                                    {turn === 'player' ? 'Ваш хід' : `Хід: ${opponent.name}`}
                                </span>
                                {extraTurn && (
                                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[9px] font-black rounded-full uppercase shadow animate-bounce">
                                        +1 Бонусний Кидок!
                                    </span>
                                )}
                            </div>

                            {/* 4 Tetrahedral Dice Visual */}
                            <div className="flex items-center gap-2">
                                {dice.map((val, idx) => (
                                    <motion.div
                                        key={idx}
                                        animate={isRolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.25, 1] } : {}}
                                        transition={{ duration: 0.35, repeat: isRolling ? Infinity : 0 }}
                                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl border-2 flex flex-col items-center justify-center shadow-lg transition-all ${
                                            val === 1
                                                ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border-yellow-200 text-black shadow-yellow-500/40 scale-105'
                                                : 'bg-stone-900 border-stone-700 text-stone-500'
                                        }`}
                                    >
                                        <span className="text-base sm:text-lg leading-none">
                                            {val === 1 ? '▲' : '△'}
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-tighter">
                                            {val === 1 ? '1' : '0'}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                {rollValue !== null ? (
                                    <div className="text-sm font-bold text-amber-200 flex items-center gap-1.5">
                                        <span>Результат кидка:</span>
                                        <span className="text-xl text-yellow-300 font-extrabold px-2 py-0.5 bg-black/40 rounded-lg border border-amber-500/40">
                                            {rollValue}
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        disabled={turn !== 'player' || isRolling}
                                        onClick={handleRoll}
                                        className={`px-5 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-black font-black text-sm rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer ${
                                            turn !== 'player' || isRolling ? 'opacity-40 cursor-not-allowed' : 'animate-bounce'
                                        }`}
                                    >
                                        <span>Кинути 4 Тетраедри</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Player Borne Off / Victory Progress */}
                        <div className="p-3 bg-[#1f1915] border border-amber-500/40 rounded-xl flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs text-amber-300 font-bold">
                                <span>Виведено вами у вічність</span>
                                <span>{playerBorneOff.length} / {TOTAL_PIECES}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                                {playerBorneOff.map(p => (
                                    <div key={p.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border border-yellow-200 shadow-md flex items-center justify-center text-[10px]">
                                        ⭐
                                    </div>
                                ))}
                                {playerBorneOff.length === 0 && (
                                    <span className="text-xs text-stone-500 italic">Поки жодної фішки не виведено</span>
                                )}
                            </div>
                            <p className="text-[10px] text-stone-400 leading-tight">
                                Перемагає той, хто першим виведе всі 7 фішок за межі дошки точним кидком (крок 15)!
                            </p>
                        </div>
                    </div>

                    {/* Opponent Reserve display */}
                    <div className="px-3 py-2 bg-[#1b1513] border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-stone-300">
                        <div className="flex items-center gap-2">
                            <span className="text-rose-400 font-bold">Резерв {opponent.name}:</span>
                            <div className="flex gap-1">
                                {oppReserve.map(p => (
                                    <div key={p.id} className="w-5 h-5 rounded-full bg-red-700 border border-rose-400 flex items-center justify-center text-[9px]">
                                        🔴
                                    </div>
                                ))}
                                {oppReserve.length === 0 && (
                                    <span className="text-stone-500 italic">Всі введені</span>
                                )}
                            </div>
                        </div>
                        <div className="text-[11px] text-stone-400">
                            Виведено супротивником: {oppBorneOff.length} / {TOTAL_PIECES}
                        </div>
                    </div>

                    {/* Battle Log */}
                    <div className="bg-[#15110e] border border-[#b8860b]/30 rounded-xl p-3 flex flex-col gap-1 max-h-24 overflow-y-auto text-xs font-mono">
                        <div className="text-[10px] uppercase font-bold text-amber-400/80 mb-0.5">Літопис Гри:</div>
                        {log.map((entry, idx) => (
                            <div key={idx} className={idx === 0 ? 'text-amber-200 font-semibold' : 'text-stone-400'}>
                                {entry}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rules Dialog (Irving Finkel / British Museum Rules) */}
                <AnimatePresence>
                    {showRules && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md p-4 sm:p-6 flex flex-col overflow-y-auto text-sm text-[#f5ebd7]"
                        >
                            <div className="flex justify-between items-center pb-3 border-b border-amber-500/40">
                                <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                                    <span>📜</span> Правила Королівської гри Ур (Ірвінг Фінкель, Британський музей)
                                </h3>
                                <button
                                    onClick={() => setShowRules(false)}
                                    className="p-1.5 bg-[#251d16] hover:bg-[#34271c] rounded-lg text-amber-300 transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 py-4 flex flex-col gap-3 leading-relaxed text-stone-300">
                                <p>
                                    <strong className="text-amber-300">Королівська гра Ур</strong> — найвідоміша настільна гра стародавнього світу. Комплект дошки та фішок знайдено сером Леонардом Вуллі в Царських гробницях Ура (Месопотамія, ~2600 р. до н.е.). Правила реконструйовані куратором Британського музею Ірвінгом Фінкелем за вавилонською клинописною табличкою (177 р. до н.е.).
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-[#1c1612] p-3 rounded-lg border border-amber-500/30 flex flex-col gap-1.5">
                                        <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                                            <span>🎲</span> 4 Тетраедричні Кістки (0..4):
                                        </h4>
                                        <p>Кидаються 4 чотиригранні пірамідки. Кожна кістка має 2 марковані вершини. Рахується кількість маркованих вершин догори: від 0 до 4.</p>
                                        <p className="text-amber-200/90 text-xs">
                                            • <strong>Кидок 0</strong>: очки відсутні, хід одразу переходить супротивнику.<br />
                                            • <strong>Кидки 1..4</strong>: переміщення фішки на відповідну кількість клітинок. Жоден кидок сам по собі не дає додаткового ходу (додатковий хід дає лише Розетка!).
                                        </p>
                                    </div>

                                    <div className="bg-[#1c1612] p-3 rounded-lg border border-amber-500/30 flex flex-col gap-1.5">
                                        <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                                            <span>⚔️</span> Спільна бойова смуга (клітинки 5–12):
                                        </h4>
                                        <p>Перші 4 клітинки — приватна безпечна смуга. На 5-й клітинці фішка виходить на центральну спільну смугу, де рухається назустріч виходу разом із супротивником.</p>
                                        <p className="text-amber-200/90 text-xs">
                                            • Якщо ви стаєте на клітинку з фішкою суперника — <strong>вона збивається</strong> та повертається в його резерв (крок 0)!<br />
                                            • Ставати на клітинку зі своєю фішкою <strong>заборонено</strong>.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-[#1c1612] p-3 rounded-lg border border-amber-500/30 flex flex-col gap-1.5">
                                    <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                                        <span>🌺</span> 5 Священних Розеток:
                                    </h4>
                                    <p>1. <strong>Додатковий кидок</strong>: Зупинка на будь-якій розетці (початковий кут, центр або фінішний кут) дарує право на додатковий кидок кісток!</p>
                                    <p>2. <strong>Святилище (Центральна розетка, крок 8)</strong>: Це священний притулок посеред поля бою. Фішка на центральній розетці є <strong>повністю недоторканною</strong> — супротивник не може її збити або стати на цю клітинку!</p>
                                </div>

                                <div className="bg-[#1c1612] p-3 rounded-lg border border-amber-500/30 flex flex-col gap-1.5">
                                    <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                                        <span>🌟</span> Вихід у Вічність (Bear off):
                                    </h4>
                                    <p>Для того, щоб фішка зійшла з дошки у вічність (крок 15), потрібен <strong>точний кидок</strong>: з 14-го кроку потрібна 1, з 13-го — 2, з 12-го — 3, з 11-го — 4. Якщо очок випало більше, фішка не може вийти цим ходом.</p>
                                    <p className="text-xs text-amber-200/90">
                                        <strong>Обов'язковість ходу</strong>: Якщо у гравця є хоча б один можливий хід, він зобов'язаний його зробити. Пропуск ходу дозволений лише тоді, коли жодна фішка не може піти на випалу кількість очок.
                                    </p>
                                </div>

                                <div className="bg-[#1c1612] p-3 rounded-lg border border-amber-500/30 flex flex-col gap-1.5">
                                    <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                                        <span>👑</span> Перемога:
                                    </h4>
                                    <p>Перемагає той, хто першим проведе всі свої 7 фішок через дошку та виведе їх за межі поля!</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowRules(false)}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl shadow-lg hover:brightness-110 transition cursor-pointer"
                            >
                                Зрозуміло, повертаємось до гри!
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Game Result Modal Overlay */}
                <AnimatePresence>
                    {gameResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md bg-[#181310] border-2 border-amber-500 rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl gap-4">
                                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl">
                                    {gameResult === 'victory' ? '👑' : '💀'}
                                </div>

                                <div>
                                    <h3 className={`text-2xl font-black ${gameResult === 'victory' ? 'text-amber-300' : 'text-rose-400'}`}>
                                        {gameResult === 'victory' ? 'Тріумф у Грі Ур!' : 'Поразка на дошці Ура'}
                                    </h3>
                                    <p className="text-sm text-stone-300 mt-1">
                                        {gameResult === 'victory'
                                            ? `Ви перевершили ${opponent.name} у володінні священними тетраедрами Шумеру!`
                                            : `${opponent.name} першим провів усі свої 7 фішок крізь священні смуги Ура.`}
                                    </p>
                                </div>

                                {gameResult === 'victory' && (
                                    <div className="w-full bg-[#241c16] border border-amber-500/40 rounded-xl p-3 flex justify-around text-xs font-bold text-amber-200">
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
                                        onClick={restartGame}
                                        className="flex-1 py-3 bg-[#2b221a] hover:bg-[#3d3025] text-amber-300 border border-amber-500/50 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-sm cursor-pointer"
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
                                        className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-black font-extrabold rounded-xl shadow-lg transition text-sm cursor-pointer"
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

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    RotateCcw, 
    Crown, 
    Coins, 
    Trophy, 
    Sparkles, 
    Volume2, 
    VolumeX, 
    X, 
    HelpCircle,
    Swords
} from 'lucide-react';

interface CheckersModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

export type PieceOwner = 'player' | 'opponent';

export interface CheckersPiece {
    id: string;
    owner: PieceOwner;
    isKing: boolean;
}

export type BoardState = (CheckersPiece | null)[][];

export interface Position {
    r: number;
    c: number;
}

export interface Move {
    from: Position;
    to: Position;
    captured?: Position;
    isJump: boolean;
}

export function createInitialBoard(): BoardState {
    const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));

    // Opponent pieces (rows 0, 1, 2) on dark squares
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 === 1) {
                board[r][c] = {
                    id: `opp_${r}_${c}`,
                    owner: 'opponent',
                    isKing: false
                };
            }
        }
    }

    // Player pieces (rows 5, 6, 7) on dark squares
    for (let r = 5; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 === 1) {
                board[r][c] = {
                    id: `ply_${r}_${c}`,
                    owner: 'player',
                    isKing: false
                };
            }
        }
    }

    return board;
}

export default function CheckersModal({
    expectedXpReward,
    isOpen,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: CheckersModalProps) {
    const [board, setBoard] = useState<BoardState>(createInitialBoard());
    const [turn, setTurn] = useState<PieceOwner>('player');
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [validMoves, setValidMoves] = useState<Move[]>([]);
    const [inMultiJump, setInMultiJump] = useState<Position | null>(null);

    const [playerCapturedCount, setPlayerCapturedCount] = useState<number>(0);
    const [oppCapturedCount, setOppCapturedCount] = useState<number>(0);
    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | 'draw' | null>(null);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);
    const [log, setLog] = useState<string[]>([]);

    const playTone = (type: 'move' | 'capture' | 'king' | 'win' | 'lose') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'move') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'capture') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(500, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                osc.start();
                osc.stop(ctx.currentTime + 0.12);
            } else if (type === 'king') {
                [523, 659, 784].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
                    o.start(ctx.currentTime + i * 0.1);
                    o.stop(ctx.currentTime + i * 0.1 + 0.2);
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
            } else if (type === 'lose') {
                [350, 310, 260].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
                    o.start(ctx.currentTime + i * 0.15);
                    o.stop(ctx.currentTime + i * 0.15 + 0.3);
                });
            }
        } catch {}
    };

    const addLog = (msg: string) => setLog(prev => [msg, ...prev.slice(0, 20)]);

    const startNewGame = () => {
        setBoard(createInitialBoard());
        setTurn('player');
        setSelectedPos(null);
        setValidMoves([]);
        setInMultiJump(null);
        setPlayerCapturedCount(0);
        setOppCapturedCount(0);
        setGameResult(null);
        setLog(['♟️ Нова партія в Англійські шашки! Ваш перший хід білими.']);
    };

    useEffect(() => {
        if (isOpen) {
            startNewGame();
        }
    }, [isOpen]);

    // Find all valid jumps and simple moves for a specific position or whole player
    const getMovesForPiece = useCallback((b: BoardState, pos: Position): Move[] => {
        const piece = b[pos.r][pos.c];
        if (!piece) return [];

        const moves: Move[] = [];
        const isPlayer = piece.owner === 'player';
        const isKing = piece.isKing;

        // Directions: player moves up (r - 1), opponent moves down (r + 1)
        const directions: [number, number][] = [];
        if (isPlayer || isKing) {
            directions.push([-1, -1], [-1, 1]); // Forward up
        }
        if (!isPlayer || isKing) {
            directions.push([1, -1], [1, 1]); // Forward down
        }

        // 1. Check JUMP captures
        for (const [dr, dc] of directions) {
            const midR = pos.r + dr;
            const midC = pos.c + dc;
            const destR = pos.r + dr * 2;
            const destC = pos.c + dc * 2;

            if (destR >= 0 && destR < 8 && destC >= 0 && destC < 8) {
                const midPiece = b[midR][midC];
                const destPiece = b[destR][destC];

                if (midPiece && midPiece.owner !== piece.owner && destPiece === null) {
                    moves.push({
                        from: pos,
                        to: { r: destR, c: destC },
                        captured: { r: midR, c: midC },
                        isJump: true
                    });
                }
            }
        }

        // 2. Check SIMPLE moves (only if not restricted to multi-jump)
        for (const [dr, dc] of directions) {
            const destR = pos.r + dr;
            const destC = pos.c + dc;

            if (destR >= 0 && destR < 8 && destC >= 0 && destC < 8) {
                if (b[destR][destC] === null) {
                    moves.push({
                        from: pos,
                        to: { r: destR, c: destC },
                        isJump: false
                    });
                }
            }
        }

        return moves;
    }, []);

    // Get all legal moves for a player. In English draughts, if jumps are available, jumps are mandatory!
    const getAllLegalMoves = useCallback((b: BoardState, player: PieceOwner): Move[] => {
        const allJumps: Move[] = [];
        const allSimple: Move[] = [];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = b[r][c];
                if (piece && piece.owner === player) {
                    const pieceMoves = getMovesForPiece(b, { r, c });
                    pieceMoves.forEach(m => {
                        if (m.isJump) allJumps.push(m);
                        else allSimple.push(m);
                    });
                }
            }
        }

        return allJumps.length > 0 ? allJumps : allSimple;
    }, [getMovesForPiece]);

    // Handle Square Click
    const handleSquareClick = (r: number, c: number) => {
        if (turn !== 'player' || gameResult !== null) return;

        const piece = board[r][c];

        // If clicking a destination square for the selected piece
        if (selectedPos) {
            const matchingMove = validMoves.find(m => m.to.r === r && m.to.c === c);
            if (matchingMove) {
                executePlayerMove(matchingMove);
                return;
            }
        }

        // If in the middle of a multi-jump sequence, cannot switch pieces!
        if (inMultiJump) {
            if (r !== inMultiJump.r || c !== inMultiJump.c) {
                addLog('⚠️ Ви повинні продовжити взяття цією ж шашкою!');
                return;
            }
        }

        // Select a player piece
        if (piece && piece.owner === 'player') {
            const allLegal = getAllLegalMoves(board, 'player');
            const pieceMoves = allLegal.filter(m => m.from.r === r && m.from.c === c);

            if (pieceMoves.length === 0) {
                const hasAnyJumps = allLegal.some(m => m.isJump);
                if (hasAnyJumps) {
                    addLog('⚠️ Обов\'язковий бій! Ви повинні бити шашку суперника.');
                } else {
                    addLog('⚠️ Ця шашка не має доступних ходів.');
                }
                return;
            }

            setSelectedPos({ r, c });
            setValidMoves(pieceMoves);
        } else {
            if (!inMultiJump) {
                setSelectedPos(null);
                setValidMoves([]);
            }
        }
    };

    // Execute Player Move
    const executePlayerMove = (move: Move) => {
        const newBoard: BoardState = board.map(row => [...row]);
        const piece = newBoard[move.from.r][move.from.c]!;

        newBoard[move.from.r][move.from.c] = null;
        newBoard[move.to.r][move.to.c] = piece;

        let wasCapture = false;
        if (move.captured) {
            newBoard[move.captured.r][move.captured.c] = null;
            setPlayerCapturedCount(prev => prev + 1);
            wasCapture = true;
            playTone('capture');
            addLog(`⚔️ Ви збили шашку ${opponent.name}!`);
        } else {
            playTone('move');
            addLog(`♟️ Ви зробили хід [${move.from.r + 1},${move.from.c + 1}] ➔ [${move.to.r + 1},${move.to.c + 1}].`);
        }

        // King promotion: reaching row 0
        let becameKing = false;
        if (!piece.isKing && move.to.r === 0) {
            piece.isKing = true;
            becameKing = true;
            playTone('king');
            addLog('👑 Ваша шашка стала ДАМКОЮ!');
        }

        // Check for multi-jump if captured
        if (wasCapture && !becameKing) {
            const moreJumps = getMovesForPiece(newBoard, move.to).filter(m => m.isJump);
            if (moreJumps.length > 0) {
                setBoard(newBoard);
                setSelectedPos(move.to);
                setValidMoves(moreJumps);
                setInMultiJump(move.to);
                addLog('⚡ Продовжуйте взяття наступної шашки!');
                return;
            }
        }

        // End player turn
        setBoard(newBoard);
        setSelectedPos(null);
        setValidMoves([]);
        setInMultiJump(null);

        // Check if opponent has lost
        const oppMoves = getAllLegalMoves(newBoard, 'opponent');
        if (oppMoves.length === 0) {
            setGameResult('victory');
            playTone('win');
            addLog(`🏆 ПЕРЕМОГА! У ${opponent.name} не залишилося ходів.`);
            return;
        }

        setTurn('opponent');
    };

    // AI Turn Execution
    useEffect(() => {
        if (turn !== 'opponent' || gameResult !== null) return;

        const aiTimer = setTimeout(() => {
            const legalMoves = getAllLegalMoves(board, 'opponent');

            if (legalMoves.length === 0) {
                setGameResult('victory');
                playTone('win');
                addLog(`🏆 ПЕРЕМОГА! У ${opponent.name} немає ходів.`);
                return;
            }

            // AI Smart Heuristic: evaluate captures, king promotion, tactical safety, and board control
            const evaluateAiMove = (m: Move, currentBoard: BoardState): number => {
                let score = 0;
                const simBoard: BoardState = currentBoard.map(row => [...row]);
                const piece = simBoard[m.from.r][m.from.c]!;
                simBoard[m.from.r][m.from.c] = null;
                simBoard[m.to.r][m.to.c] = piece;

                const movingPiece = { ...piece };

                if (m.isJump) {
                    score += 35; // Base capture value
                    if (m.captured) {
                        const cap = simBoard[m.captured.r][m.captured.c];
                        if (cap?.isKing) score += 30; // Capture enemy King!
                        simBoard[m.captured.r][m.captured.c] = null;
                    }

                    // Check king promotion
                    if (!movingPiece.isKing && m.to.r === 7) {
                        movingPiece.isKing = true;
                        score += 50; // Crowning bonus
                    } else if (!movingPiece.isKing) {
                        // Check for combo chain jumps
                        const chainJumps = getMovesForPiece(simBoard, m.to).filter(cm => cm.isJump);
                        if (chainJumps.length > 0) {
                            score += chainJumps.length * 35; // Huge bonus for chain multi-jump
                        }
                    }
                } else {
                    // Simple move
                    if (!movingPiece.isKing && m.to.r === 7) {
                        score += 45; // Promote to King!
                    }

                    // Protect back rank (row 0) from premature vacating
                    if (m.from.r === 0 && !piece.isKing) {
                        const playerAdvancing = simBoard.some((row, rIdx) => 
                            rIdx <= 4 && row.some(p => p && p.owner === 'player')
                        );
                        if (playerAdvancing) score -= 18;
                    }

                    // Center control
                    if (m.to.c >= 2 && m.to.c <= 5) score += 6;
                    if (m.to.r >= 3 && m.to.r <= 5) score += 5;

                    // Edge safety
                    if (m.to.c === 0 || m.to.c === 7) score += 4;

                    // Advancement for men
                    if (!piece.isKing) {
                        score += (m.to.r - m.from.r) * 4;
                    } else {
                        // King moves towards closest player piece
                        let minDist = 99;
                        for (let r = 0; r < 8; r++) {
                            for (let c = 0; c < 8; c++) {
                                if (simBoard[r][c]?.owner === 'player') {
                                    const dist = Math.abs(m.to.r - r) + Math.abs(m.to.c - c);
                                    if (dist < minDist) minDist = dist;
                                }
                            }
                        }
                        score += Math.max(0, 16 - minDist);
                    }
                }

                // TACTICAL SAFETY CHECK: What can player counter-attack on their turn?
                const playerCounterMoves = getAllLegalMoves(simBoard, 'player');
                const playerJumps = playerCounterMoves.filter(pm => pm.isJump);

                if (playerJumps.length > 0) {
                    // Player has mandatory jump!
                    const capturesOurMovedPiece = playerJumps.some(pm => 
                        pm.captured && pm.captured.r === m.to.r && pm.captured.c === m.to.c
                    );

                    if (capturesOurMovedPiece) {
                        // Immediate counter-kill by player!
                        score -= piece.isKing ? 75 : 45;
                    } else {
                        // Player captures another piece
                        score -= 25;
                    }

                    const playerCrownsOnJump = playerJumps.some(pm => pm.to.r === 0);
                    if (playerCrownsOnJump) score -= 30;
                } else {
                    const playerCrownsNext = playerCounterMoves.some(pm => pm.to.r === 0);
                    if (playerCrownsNext) score -= 15;
                }

                return score;
            };

            legalMoves.sort((a, b) => evaluateAiMove(b, board) - evaluateAiMove(a, board));

            const chosenMove = legalMoves[0];
            const newBoard: BoardState = board.map(row => [...row]);
            const piece = newBoard[chosenMove.from.r][chosenMove.from.c]!;

            newBoard[chosenMove.from.r][chosenMove.from.c] = null;
            newBoard[chosenMove.to.r][chosenMove.to.c] = piece;

            let wasCapture = false;
            if (chosenMove.captured) {
                newBoard[chosenMove.captured.r][chosenMove.captured.c] = null;
                setOppCapturedCount(prev => prev + 1);
                wasCapture = true;
                playTone('capture');
                addLog(`⚔️ ${opponent.name} збив вашу шашку!`);
            } else {
                playTone('move');
                addLog(`♟️ ${opponent.name} походив.`);
            }

            // Opponent king promotion
            let becameKing = false;
            if (!piece.isKing && chosenMove.to.r === 7) {
                piece.isKing = true;
                becameKing = true;
                playTone('king');
                addLog(`👑 Шашка ${opponent.name} стала ДАМКОЮ!`);
            }

            // Recursive multi-jump for AI
            const handleAiChainJumps = (curBoard: BoardState, curPos: Position, curPiece: CheckersPiece) => {
                const chainJumps = getMovesForPiece(curBoard, curPos).filter(jm => jm.isJump);
                if (chainJumps.length === 0) {
                    finishAiTurn(curBoard);
                    return;
                }

                setTimeout(() => {
                    const nextJump = chainJumps[0];
                    curBoard[nextJump.from.r][nextJump.from.c] = null;
                    curBoard[nextJump.to.r][nextJump.to.c] = curPiece;
                    if (nextJump.captured) {
                        curBoard[nextJump.captured.r][nextJump.captured.c] = null;
                        setOppCapturedCount(prev => prev + 1);
                    }
                    let crownedInChain = false;
                    if (!curPiece.isKing && nextJump.to.r === 7) {
                        curPiece.isKing = true;
                        crownedInChain = true;
                        playTone('king');
                        addLog(`👑 Шашка ${opponent.name} стала ДАМКОЮ!`);
                    }
                    setBoard([...curBoard]);
                    playTone('capture');

                    if (!crownedInChain) {
                        handleAiChainJumps(curBoard, nextJump.to, curPiece);
                    } else {
                        finishAiTurn(curBoard);
                    }
                }, 500);
            };

            if (wasCapture && !becameKing) {
                const moreJumps = getMovesForPiece(newBoard, chosenMove.to).filter(m => m.isJump);
                if (moreJumps.length > 0) {
                    setBoard(newBoard);
                    handleAiChainJumps(newBoard, chosenMove.to, piece);
                    return;
                }
            }

            finishAiTurn(newBoard);
        }, 800);

        return () => clearTimeout(aiTimer);
    }, [turn, board, gameResult, getAllLegalMoves, getMovesForPiece, opponent.name]);

    const finishAiTurn = (newBoard: BoardState) => {
        setBoard(newBoard);

        // Check if player has lost
        const playerMoves = getAllLegalMoves(newBoard, 'player');
        if (playerMoves.length === 0) {
            setGameResult('defeat');
            playTone('lose');
            addLog(`💀 ПОРАЗКА! У вас не залишилося ходів.`);
            return;
        }

        setTurn('player');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="relative w-full max-w-4xl h-[94vh] bg-[#1a140f] border-2 border-amber-600/70 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7]"
            >
                {/* Header */}
                <div className="px-4 py-2.5 bg-[#251b14] border-b border-amber-600/40 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl p-1.5 rounded-lg bg-[#140e0b] border border-amber-500/40">
                            ♟️
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-serif font-black text-sm sm:text-base text-amber-300">
                                    Англійські Шашки (Draughts)
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                                    {tavernName}
                                </span>
                            </div>
                            <p className="text-xs text-stone-400">
                                Суперник: <strong className="text-stone-200">{opponent.name}</strong> ({opponent.title})
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

                {/* Main Content: Board + Sidebar Info */}
                <div className="flex-1 p-3 sm:p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2d1b13] via-[#1a110c] to-[#100b08] flex flex-col md:flex-row items-center justify-between gap-4 overflow-y-auto">
                    {/* 8x8 Board Container */}
                    <div className="w-full max-w-[440px] sm:max-w-[480px] aspect-square p-3 rounded-2xl bg-[#361e12] border-4 border-[#52311f] shadow-2xl flex flex-col justify-between">
                        <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-lg overflow-hidden border-2 border-[#20110a] shadow-inner">
                            {board.map((row, r) => (
                                row.map((piece, c) => {
                                    const isDark = (r + c) % 2 === 1;
                                    const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                                    const isValidTarget = validMoves.some(m => m.to.r === r && m.to.c === c);

                                    return (
                                        <div
                                            key={`${r}_${c}`}
                                            onClick={() => handleSquareClick(r, c)}
                                            className={`relative flex items-center justify-center cursor-pointer select-none transition-colors ${
                                                isDark ? 'bg-[#42291a]' : 'bg-[#e0c8a8]'
                                            } ${isSelected ? 'ring-4 ring-amber-400 inset-0 z-10' : ''}`}
                                        >
                                            {/* Valid Target Glow Dot */}
                                            {isValidTarget && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: [1, 1.3, 1] }}
                                                    transition={{ repeat: Infinity, duration: 1.2 }}
                                                    className="absolute w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-emerald-400/90 shadow-[0_0_10px_#34d399] z-20"
                                                />
                                            )}

                                            {/* Checkers Piece */}
                                            {piece && (
                                                <motion.div
                                                    layout
                                                    whileHover={{ scale: piece.owner === 'player' ? 1.08 : 1 }}
                                                    className={`relative w-8 sm:w-11 h-8 sm:h-11 rounded-full border-2 sm:border-3 shadow-lg flex items-center justify-center transition-all ${
                                                        piece.owner === 'player'
                                                            ? 'bg-gradient-to-br from-[#fff6eb] via-[#f7e0c4] to-[#deb887] border-[#8b5a2b] text-[#5c3a1e]'
                                                            : 'bg-gradient-to-br from-[#3b2316] via-[#21140c] to-[#0d0704] border-[#d97706] text-amber-400'
                                                    }`}
                                                >
                                                    {piece.isKing ? (
                                                        <Crown className="w-5 sm:w-6 h-5 sm:h-6 text-amber-500 fill-amber-400 filter drop-shadow" />
                                                    ) : (
                                                        <div className="w-4 sm:w-5 h-4 sm:h-5 rounded-full border border-black/20 opacity-50" />
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })
                            ))}
                        </div>
                    </div>

                    {/* Sidebar / Stats & Turn Information */}
                    <div className="w-full md:w-72 flex flex-col justify-between gap-3 h-full">
                        {/* Opponent Info Card */}
                        <div className="p-3 rounded-xl bg-black/40 border border-stone-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="text-xl p-1 rounded-full bg-stone-900 border border-amber-500/40">
                                    {opponent.avatar}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-stone-200">{opponent.name}</div>
                                    <div className="text-[11px] text-stone-400">Збито ваших: {oppCapturedCount}</div>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-[#21140c] border border-amber-500" title="Темні шашки" />
                        </div>

                        {/* Turn Indicator */}
                        <div className={`p-3 rounded-xl border flex items-center justify-between font-bold text-xs ${
                            turn === 'player' 
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                                : 'bg-stone-900/80 border-stone-700 text-stone-400'
                        }`}>
                            <div className="flex items-center gap-2">
                                <Swords className="w-4 h-4" />
                                <span>{turn === 'player' ? 'ВАШ ХІД (Світлі)' : `ХІД ${opponent.name}...`}</span>
                            </div>
                            {turn === 'player' && (
                                <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-black uppercase">
                                    Ходіть
                                </span>
                            )}
                        </div>

                        {/* Player Info Card */}
                        <div className="p-3 rounded-xl bg-black/50 border border-amber-500/50 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="text-xl p-1 rounded-full bg-stone-900 border border-amber-500/40">
                                    🧑‍🌾
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-amber-300">Ви (Гравець)</div>
                                    <div className="text-[11px] text-stone-300">Збито фішок ворога: <strong className="text-yellow-400">{playerCapturedCount} / 12</strong></div>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-[#f7e0c4] border border-[#8b5a2b]" title="Світлі шашки" />
                        </div>

                        {/* Move Log */}
                        <div className="flex-1 min-h-[100px] p-2.5 rounded-xl bg-black/40 border border-stone-800 text-[11px] text-stone-300 space-y-1 overflow-y-auto">
                            <div className="text-[10px] font-black text-amber-400 uppercase border-b border-stone-800 pb-1">
                                Історія партії
                            </div>
                            {log.map((entry, idx) => (
                                <div key={idx} className="leading-tight py-0.5">
                                    {entry}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Game Result Modal */}
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
                                            👑
                                        </div>
                                        <h2 className="text-2xl font-serif font-black text-amber-300">
                                            ШАХОВИЙ ТРІУМФ!
                                        </h2>
                                        <p className="text-sm text-[#f5ebd7]">
                                            Ви перемогли {opponent.name} у шашках!
                                        </p>
                                        <div className="p-3 rounded-xl bg-[#241a12] border border-amber-500/40 flex items-center justify-around text-xs font-bold text-amber-300">
                                            <div className="flex items-center gap-1.5">
                                                <Coins className="w-4 h-4 text-amber-400" />
                                                <span>+{opponent.rewards.gold} золота</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-emerald-400">
                                                <Sparkles className="w-4 h-4" />
                                                <span>+{(expectedXpReward ?? (opponent.rewards.xp || 120))} XP</span>
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
                                            ПОРАЗКА В ШАШКАХ!
                                        </h2>
                                        <p className="text-sm text-[#f5ebd7]">
                                            {opponent.name}: «Досвід перемагає завзяття!»
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
                                className="w-full max-w-md p-5 rounded-2xl bg-[#1a140f] border-2 border-amber-500/70 shadow-2xl space-y-3 text-xs text-[#e8dac7]"
                            >
                                <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                                    <h3 className="text-base font-serif font-black text-amber-300">
                                        Правила Англійських Шашок
                                    </h3>
                                    <button
                                        onClick={() => setShowRules(false)}
                                        className="p-1 rounded-lg bg-stone-800 text-stone-300 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p><strong>1. Рух:</strong> Прості шашки ходять на 1 клітинку вперед по діагоналі на темні клітинки.</p>
                                <p><strong>2. Взяття:</strong> Якщо поруч по діагоналі стоїть шашка суперника, а за нею вільна клітинка — ви зобов'язані перестрибнути її та збити. Якщо можливо збити ще — стрибок продовжується!</p>
                                <p><strong>3. Дамка:</strong> Дійшовши до останнього ряду поля, шашка стає Дамкою (Коронованою) і отримує право ходити та бити як вперед, так і назад.</p>
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

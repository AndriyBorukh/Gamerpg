import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ToySoldier, WorldProgress, OpponentData } from '../types';
import { saveWorldProgress } from '../lib/worldData';
import { playDiceRollSound, playLevelUpSound, playVictorySound, playDefeatSound } from '../lib/soundEffects';
import { 
    X, 
    Crown, 
    Swords, 
    Shield, 
    Sparkles, 
    ShoppingBag, 
    Trophy, 
    Flame,
    Zap
} from 'lucide-react';
import { getFigurineRequirement, executeAutoPurchaseForActivity } from '../lib/toyAutoPurchase';

interface ToyPawnsModalProps {
    isOpen: boolean;
    boardSize?: 8 | 10 | 12;
    opponent: OpponentData;
    tavernName?: string;
    progress: WorldProgress;
    onUpdateProgress: (newProgress: WorldProgress) => void;
    onVictory?: () => void;
    onDefeat?: () => void;
    onClose: () => void;
    onOpenShop?: () => void;
    onOpenToyShop?: () => void;
    onOpenDecompression?: () => void;
}

export interface PawnPiece {
    id: string;
    owner: 'player' | 'opponent';
    toyId?: string;
    name: string;
    avatar: string;
    experience: number;
    deaths: number;
    isKing?: boolean;
}

export type BoardState = (PawnPiece | null)[][];

export function ToyPawnsModal({
    isOpen,
    boardSize = 8,
    opponent,
    tavernName,
    progress,
    onUpdateProgress,
    onVictory,
    onDefeat,
    onClose,
    onOpenShop,
    onOpenToyShop,
    onOpenDecompression
}: ToyPawnsModalProps) {
    const pieceRows = (boardSize - 2) / 2;

    const [board, setBoard] = useState<BoardState>(() => Array(boardSize).fill(null).map(() => Array(boardSize).fill(null)));
    const boardRef = React.useRef(board);
    boardRef.current = board;
    const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
    const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent'>('player');
    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
    const [actionLog, setActionLog] = useState<string[]>([]);

    // Combat state for d20 duel
    const [combatState, setCombatState] = useState<{
        active: boolean;
        attacker: { piece: PawnPiece; r: number; c: number };
        defender: { piece: PawnPiece; r: number; c: number };
        attackerRoll: number | null;
        defenderRoll: number | null;
        winner: 'attacker' | 'defender' | null;
    } | null>(null);

    // Only ready (not worn out 3/3) pawns can participate:
    const playerPawns: ToySoldier[] = (progress.toySoldiers || []).filter(
        s => (s.type === 'пішак' || s.type?.includes('пішак')) && (s.deaths || 0) < 3
    );
    const requiredPawns = boardSize * pieceRows;
    const hasEnoughPawns = playerPawns.length >= requiredPawns;

    // Initialize Board
    useEffect(() => {
        if (!isOpen || !hasEnoughPawns) return;

        const newBoard: BoardState = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));

        // Opponent Pawns
        let oppIdx = 1;
        for (let r = 0; r < pieceRows; r++) {
            for (let c = 0; c < boardSize; c++) {
                newBoard[r][c] = {
                    id: `opp_pawn_${r}_${c}`,
                    owner: 'opponent',
                    name: `Ворожий пішак #${oppIdx++}`,
                    avatar: '♟️',
                    experience: 0,
                    deaths: 0
                };
            }
        }

        // Player Pawns (use owned pawns)
        let playerIdx = 0;
        const startPlayerRow = boardSize - pieceRows;
        for (let r = startPlayerRow; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const soldier = playerPawns[playerIdx];
                if (soldier) {
                    newBoard[r][c] = {
                        id: `ply_pawn_${soldier.id}`,
                        owner: 'player',
                        toyId: soldier.id,
                        name: soldier.name,
                        avatar: soldier.avatar || '♟️',
                        experience: soldier.experience || 0,
                        deaths: soldier.deaths || 0
                    };
                }
                playerIdx++;
            }
        }

        setBoard(newBoard);
        setCurrentTurn('player');
        setSelectedPos(null);
        setGameResult(null);
        setCombatState(null);
        setActionLog([`♟️ Початок бою в Бойові Пішаки ${boardSize}х${boardSize} проти ${opponent?.name || 'Супротивника'}!`]);
    }, [isOpen, opponent?.name, boardSize, hasEnoughPawns]);

    if (!isOpen) return null;

    if (!hasEnoughPawns) {
        const missingCount = Math.max(0, requiredPawns - playerPawns.length);
        const act = boardSize === 12 ? 'toy_pawns_12x12' : boardSize === 10 ? 'toy_pawns_10x10' : 'toy_pawns';
        const reqInfo = getFigurineRequirement(act, progress);
        const missingCost = reqInfo?.missingCost || (missingCount * 10);
        const canAfford = (progress.playerGold || 0) >= missingCost;

        const handleAutoBuyPawns = () => {
            const res = executeAutoPurchaseForActivity(act, progress);
            if (res.success && res.updatedProgress) {
                onUpdateProgress(res.updatedProgress);
                saveWorldProgress(res.updatedProgress);
            }
        };

        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#18120e] border-2 border-red-500/60 rounded-3xl p-6 max-w-lg w-full text-center text-[#f5ebd7] space-y-4 shadow-2xl"
                >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950/80 border-2 border-red-500/50 flex items-center justify-center text-3xl shadow-inner">
                        ♟️
                    </div>

                    <div>
                        <h3 className="font-serif font-black text-xl text-amber-300">
                            Недостатньо пішаків для гри!
                        </h3>
                        <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                            Для гри в <strong className="text-amber-200">«Бойові Пішаки {boardSize}х{boardSize}»</strong> необхідно мати у своїй колекції <strong>{requiredPawns} готових пішаків</strong> (не зношених, &lt; 3/3 поразок).
                        </p>
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-stone-800 text-xs flex items-center justify-between">
                        <span className="text-stone-300 font-bold">Готових пішаків у колекції:</span>
                        <span className={`font-black text-base px-3 py-1 rounded-xl border ${
                            playerPawns.length >= requiredPawns
                                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                                : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                        }`}>
                            {playerPawns.length} / {requiredPawns}
                        </span>
                    </div>

                    <p className="text-[11px] text-amber-400/90 italic">
                        *Зношені пішаки (3/3) не можуть брати участь у грі. Скористайтеся автопокупкою або придбайте пішаки в магазині!
                    </p>

                    <div className="flex flex-col gap-2 pt-2">
                        {canAfford ? (
                            <button
                                onClick={handleAutoBuyPawns}
                                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition hover:scale-[1.02]"
                            >
                                <Zap className="w-4 h-4 fill-current" />
                                <span>⚡ Автопокупка {missingCount} пішаків ({missingCost} 🪙)</span>
                            </button>
                        ) : (
                            <div className="text-[11px] text-rose-400 font-semibold p-2 bg-rose-950/40 rounded-xl border border-rose-900/50">
                                ⚠️ Потрібно {missingCost} 🪙 для автопокупки (маєте {progress.playerGold} 🪙)
                            </div>
                        )}

                        <div className="flex gap-2">
                            {onOpenToyShop && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenToyShop();
                                    }}
                                    className="flex-1 py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition"
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    <span>Магазин Іграшок</span>
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition cursor-pointer"
                            >
                                Закрити
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Get valid moves for a pawn
    const getValidMoves = (r: number, c: number, currentBoard: BoardState = board): { r: number; c: number; isAttack: boolean }[] => {
        const piece = currentBoard[r][c];
        if (!piece) return [];

        const moves: { r: number; c: number; isAttack: boolean }[] = [];
        
        if (piece.isKing) {
            // King Moves: exactly 1 square in any of the 8 directions (diagonal & orthogonal)
            const kingDirs = [
                [-1, -1], [-1, 1], [1, -1], [1, 1], // Diagonal
                [-1, 0], [1, 0], [0, -1], [0, 1]    // Orthogonal
            ];
            for (const [dr, dc] of kingDirs) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
                    const target = currentBoard[nr][nc];
                    if (!target) {
                        moves.push({ r: nr, c: nc, isAttack: false });
                    } else if (target.owner !== piece.owner) {
                        moves.push({ r: nr, c: nc, isAttack: true });
                    }
                }
            }
        } else {
            // 1. Forward move (1 square)
            const forwardRow = piece.owner === 'player' ? r - 1 : r + 1;
            if (forwardRow >= 0 && forwardRow < boardSize) {
                // Straight forward: target must be EMPTY
                if (!currentBoard[forwardRow][c]) {
                    moves.push({ r: forwardRow, c, isAttack: false });
                    
                    // 2. Initial double forward move (2 squares)
                    const isPlayerStarting = piece.owner === 'player' && r >= (boardSize - pieceRows);
                    const isOpponentStarting = piece.owner === 'opponent' && r < pieceRows;
                    if (isPlayerStarting || isOpponentStarting) {
                        const doubleForwardRow = piece.owner === 'player' ? r - 2 : r + 2;
                        if (doubleForwardRow >= 0 && doubleForwardRow < boardSize && !currentBoard[doubleForwardRow][c]) {
                            moves.push({ r: doubleForwardRow, c, isAttack: false });
                        }
                    }
                }
            }

            // 3. Diagonal captures (1 square)
            const diagonalCols = [c - 1, c + 1];
            if (forwardRow >= 0 && forwardRow < boardSize) {
                for (const dc of diagonalCols) {
                    if (dc >= 0 && dc < boardSize) {
                        const target = currentBoard[forwardRow][dc];
                        if (target && target.owner !== piece.owner) {
                            moves.push({ r: forwardRow, c: dc, isAttack: true });
                        }
                    }
                }
            }
        }

        return moves;
    };

    // Square Click
    const handleSquareClick = (r: number, c: number) => {
        if (currentTurn !== 'player' || combatState?.active || gameResult) return;

        const clickedPiece = board[r][c];

        if (clickedPiece && clickedPiece.owner === 'player') {
            setSelectedPos({ r, c });
            return;
        }

        if (selectedPos) {
            const attacker = board[selectedPos.r]?.[selectedPos.c];
            if (!attacker) {
                setSelectedPos(null);
                return;
            }

            const moves = getValidMoves(selectedPos.r, selectedPos.c);
            const targetMove = moves.find(m => m.r === r && m.c === c);

            if (targetMove) {
                if (targetMove.isAttack) {
                    const defender = board[r]?.[c];
                    if (!defender) return;

                    startCombatDuel(
                        { piece: attacker, r: selectedPos.r, c: selectedPos.c },
                        { piece: defender, r, c }
                    );
                } else {
                    // Simple Move
                    const newBoard = board.map(row => [...row]);
                    newBoard[selectedPos.r][selectedPos.c] = null;
                    newBoard[r][c] = attacker;

                    // Promote to King if reaching opponent's first row (row 0)
                    if (r === 0 && !attacker.isKing) {
                        attacker.isKing = true;
                        attacker.avatar = '👑';
                        attacker.name = `Король (${attacker.name})`;
                        setActionLog(prev => [`👑 Ваш ${attacker.name} перетворився на Короля!`, ...prev.slice(0, 15)]);
                    }

                    setBoard(newBoard);
                    setSelectedPos(null);

                    setActionLog(prev => [`👟 ${attacker.name || 'Пішак'} просунувся на (${r + 1}, ${c + 1}).`, ...prev.slice(0, 15)]);

                    checkGameEnd(newBoard, 'opponent');
                }
            }
        }
    };

    // Start d20 Combat Duel
    const startCombatDuel = (
        attacker: { piece: PawnPiece; r: number; c: number },
        defender: { piece: PawnPiece; r: number; c: number }
    ) => {
        if (!attacker?.piece || !defender?.piece) return;

        setCombatState({
            active: true,
            attacker,
            defender,
            attackerRoll: null,
            defenderRoll: null,
            winner: null
        });

        playDiceRollSound();

        setTimeout(() => {
            const aRoll = Math.floor(Math.random() * 20) + 1;
            const dRoll = Math.floor(Math.random() * 20) + 1;

            const isAttackerWinner = aRoll >= dRoll;

            setCombatState(prev => prev ? {
                ...prev,
                attackerRoll: aRoll,
                defenderRoll: dRoll,
                winner: isAttackerWinner ? 'attacker' : 'defender'
            } : null);

            setTimeout(() => {
                resolveCombatDuel(attacker, defender, isAttackerWinner);
            }, 1200);
        }, 800);
    };

    // Resolve combat outcome
    const resolveCombatDuel = (
        attacker: { piece: PawnPiece; r: number; c: number },
        defender: { piece: PawnPiece; r: number; c: number },
        attackerWon: boolean
    ) => {
        if (!attacker?.piece || !defender?.piece) return;

        const newBoard = boardRef.current.map(row => [...row]);

        if (attackerWon) {
            newBoard[attacker.r][attacker.c] = null;
            // Every capture gives +1 XP to attacking pawn!
            const updatedAttacker = {
                ...attacker.piece,
                experience: attacker.piece.owner === 'player' ? (attacker.piece.experience || 0) + 1 : (attacker.piece.experience || 0)
            };

            // Promote to King if reaching baseline on capture
            if (updatedAttacker.owner === 'player' && defender.r === 0 && !updatedAttacker.isKing) {
                updatedAttacker.isKing = true;
                updatedAttacker.avatar = '👑';
                updatedAttacker.name = `Король (${updatedAttacker.name})`;
                setActionLog(prev => [`👑 Ваш ${updatedAttacker.name} перетворився на Короля!`, ...prev.slice(0, 15)]);
            } else if (updatedAttacker.owner === 'opponent' && defender.r === boardSize - 1 && !updatedAttacker.isKing) {
                updatedAttacker.isKing = true;
                updatedAttacker.avatar = '👑';
                updatedAttacker.name = `Ворожий Король`;
                setActionLog(prev => [`👑 Ворожий пішак перетворився на Короля!`, ...prev.slice(0, 15)]);
            }

            newBoard[defender.r][defender.c] = updatedAttacker;

            const isPlayerDefender = defender.piece?.owner === 'player';
            if (isPlayerDefender && defender.piece?.toyId) {
                const lostToyId = defender.piece.toyId;
                const currentList = progress.toySoldiers || [];
                const updatedSoldiers = currentList.map(s => {
                    if (s.id === lostToyId) {
                        return { ...s, deaths: (s.deaths || 0) + 1 };
                    }
                    return s;
                });
                const updatedProg: WorldProgress = {
                    ...progress,
                    toySoldiers: updatedSoldiers
                };
                onUpdateProgress(updatedProg);
                saveWorldProgress(updatedProg);
            }

            setActionLog(prev => [
                `⚔️ ${attacker.piece?.name || 'Пішак'} розбив ${defender.piece?.name || 'Пішака'} (+1 XP)!${isPlayerDefender ? ' 💥 Побитий пішак отримав 1 поломку!' : ''}`,
                ...prev.slice(0, 15)
            ]);
        } else {
            // Attacker lost the duel: defender defended! Both pawns stay in place, turn passes.
            setActionLog(prev => [
                `🛡️ ${defender.piece?.name || 'Пішак'} відбив атаку ${attacker.piece?.name || 'Пішака'}! Обидва пішаки залишаються на місцях.`,
                ...prev.slice(0, 15)
            ]);
        }

        setBoard(newBoard);
        setCombatState(null);
        setSelectedPos(null);

        checkGameEnd(newBoard, attacker.piece?.owner === 'player' ? 'opponent' : 'player');
    };

    // AI Turn
    const runAiTurn = (currentBoard: BoardState) => {
        const aiPawns: { r: number; c: number; piece: PawnPiece }[] = [];
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (currentBoard[r][c]?.owner === 'opponent') {
                    aiPawns.push({ r, c, piece: currentBoard[r][c]! });
                }
            }
        }

        if (aiPawns.length === 0) {
            handleVictory(currentBoard);
            return;
        }

        const allMoves: { from: { r: number; c: number }; to: { r: number; c: number; isAttack: boolean }; piece: PawnPiece }[] = [];
        for (const ai of aiPawns) {
            const moves = getValidMoves(ai.r, ai.c, currentBoard);
            for (const m of moves) {
                allMoves.push({ from: { r: ai.r, c: ai.c }, to: m, piece: ai.piece });
            }
        }

        if (allMoves.length === 0) {
            handleVictory(currentBoard);
            return;
        }

        const attackMoves = allMoves.filter(m => m.to.isAttack);
        const chosenMove = attackMoves.length > 0
            ? attackMoves[Math.floor(Math.random() * attackMoves.length)]
            : allMoves[Math.floor(Math.random() * allMoves.length)];

        if (chosenMove.to.isAttack) {
            const defender = currentBoard[chosenMove.to.r][chosenMove.to.c]!;
            startCombatDuel(
                { piece: chosenMove.piece, r: chosenMove.from.r, c: chosenMove.from.c },
                { piece: defender, r: chosenMove.to.r, c: chosenMove.to.c }
            );
        } else {
            const newBoard = currentBoard.map(row => [...row]);
            newBoard[chosenMove.from.r][chosenMove.from.c] = null;

            // Promote to King if reaching player's baseline (boardSize - 1)
            if (chosenMove.to.r === boardSize - 1 && !chosenMove.piece.isKing) {
                chosenMove.piece.isKing = true;
                chosenMove.piece.avatar = '👑';
                chosenMove.piece.name = `Ворожий Король`;
                setActionLog(prev => [`👑 Ворожий пішак перетворився на Короля!`, ...prev.slice(0, 15)]);
            }

            newBoard[chosenMove.to.r][chosenMove.to.c] = chosenMove.piece;

            setBoard(newBoard);
            setActionLog(prev => [`🤖 Ворожий ${chosenMove.piece.name} зробив хід.`, ...prev.slice(0, 15)]);

            setCurrentTurn('player');
            checkGameEnd(newBoard, 'player');
        }
    };

    // Check Game End
    const checkGameEnd = (currentBoard: BoardState, nextTurn: 'player' | 'opponent') => {
        let playerAlive = 0;
        let oppAlive = 0;

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (currentBoard[r][c]?.owner === 'player') playerAlive++;
                if (currentBoard[r][c]?.owner === 'opponent') oppAlive++;
            }
        }

        if (oppAlive === 0) {
            handleVictory(currentBoard);
            return;
        } else if (playerAlive === 0) {
            handleDefeat();
            return;
        }

        // Check for Stalemate (Пат)
        let totalValidMoves = 0;
        const targetOwner = nextTurn === 'player' ? 'player' : 'opponent';

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const piece = currentBoard[r][c];
                if (piece && piece.owner === targetOwner) {
                    const moves = getValidMoves(r, c, currentBoard);
                    totalValidMoves += moves.length;
                }
            }
        }

        if (totalValidMoves === 0) {
            // Stalemate (Пат): the one who cannot move loses!
            if (nextTurn === 'player') {
                setActionLog(prev => [`💀 ПАТ! У вас немає можливих ходів. Ви програли!`, ...prev.slice(0, 15)]);
                handleDefeat();
            } else {
                setActionLog(prev => [`🎉 ПАТ! У суперника немає можливих ходів. Ви перемогли!`, ...prev.slice(0, 15)]);
                handleVictory(currentBoard);
            }
            return;
        }

        setCurrentTurn(nextTurn);
        if (nextTurn === 'opponent') {
            setTimeout(() => runAiTurn(currentBoard), 600);
        }
    };

    // Victory Handler
    const handleVictory = (finalBoard: BoardState) => {
        setGameResult('victory');
        playVictorySound();

        // Collect surviving player pawn IDs and their gained in-game XP
        const survivingPawnsMap = new Map<string, number>();
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const p = finalBoard[r][c];
                if (p && p.owner === 'player' && p.toyId) {
                    // +1 XP for surviving match win + any in-match capture XP
                    survivingPawnsMap.set(p.toyId, p.experience + 1);
                }
            }
        }

        const updatedSoldiers = (progress.toySoldiers || []).map(s => {
            if (survivingPawnsMap.has(s.id)) {
                return {
                    ...s,
                    experience: survivingPawnsMap.get(s.id)!
                };
            }
            return s;
        });

        const updatedProgress: WorldProgress = {
            ...progress,
            toySoldiers: updatedSoldiers
        };

        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
    };

    // Defeat Handler
    const handleDefeat = () => {
        setGameResult('defeat');
        playDefeatSound();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#18120e] border-2 border-amber-600/50 rounded-3xl p-4 sm:p-5 max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden text-[#f5ebd7]"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-3 border-b border-amber-900/40">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-xl">
                                ♟️
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-amber-200 font-serif flex items-center gap-2">
                                    <span>Бойові Пішаки {boardSize}х{boardSize}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-600/40 text-indigo-300 font-sans">
                                        {pieceRows} Ряди • d20 Двобої
                                    </span>
                                </h2>
                                <p className="text-[11px] text-stone-400">
                                    Супротивник: <strong className="text-amber-300">{opponent.name}</strong> • Хід: {currentTurn === 'player' ? '🟢 Ваш хід' : '🔴 Хід суперника'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (gameResult === 'victory' && onVictory) {
                                    onVictory();
                                } else if (gameResult === 'defeat' && onDefeat) {
                                    onDefeat();
                                } else {
                                    onClose();
                                }
                            }}
                            className="p-1.5 text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 rounded-full border border-stone-800 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-3 overflow-y-auto flex-1">
                        {/* Board */}
                        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-[#100b08] p-3 rounded-2xl border border-stone-800 self-start">
                            <div 
                                className="grid gap-0.5 p-2 bg-[#2a1d15] rounded-xl border-2 border-amber-900/60 shadow-inner w-full aspect-square"
                                style={{
                                    gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                                    maxWidth: boardSize === 12 ? 'min(100%, 540px)' : boardSize === 10 ? 'min(100%, 480px)' : 'min(100%, 420px)'
                                }}
                            >
                                {board.map((row, r) =>
                                    row.map((cell, c) => {
                                        const isEven = (r + c) % 2 === 0;
                                        const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                                        const validMoves = selectedPos ? getValidMoves(selectedPos.r, selectedPos.c) : [];
                                        const isValidMove = validMoves.some(m => m.r === r && m.c === c);

                                        return (
                                            <button
                                                key={`${r}-${c}`}
                                                disabled={currentTurn !== 'player' || combatState?.active || !!gameResult}
                                                onClick={() => handleSquareClick(r, c)}
                                                className={`aspect-square relative flex items-center justify-center transition-all rounded-[3px] select-none ${
                                                    isSelected
                                                        ? 'bg-amber-500/50 ring-2 ring-amber-400 z-10'
                                                        : isValidMove
                                                        ? 'bg-emerald-900/60 ring-2 ring-emerald-400 animate-pulse z-10 cursor-pointer'
                                                        : isEven
                                                        ? 'bg-[#3b2b20]'
                                                        : 'bg-[#211610]'
                                                }`}
                                            >
                                                {cell && (
                                                    <div
                                                        className={`w-4/5 h-4/5 rounded-full flex items-center justify-center text-sm shadow-md transition-transform ${
                                                            cell.owner === 'player'
                                                                ? 'bg-gradient-to-b from-indigo-600 to-purple-800 border-2 border-indigo-300 text-white'
                                                                : 'bg-gradient-to-b from-stone-200 to-stone-400 border-2 border-white text-stone-900'
                                                        }`}
                                                    >
                                                        <span>{cell.avatar}</span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right: Info & Tactical Log */}
                        <div className="lg:col-span-4 flex flex-col gap-3">
                            <div className="p-3 bg-[#1e1712] border border-amber-900/40 rounded-2xl text-xs space-y-1.5">
                                <h4 className="font-bold text-amber-200 font-serif flex items-center gap-1.5">
                                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Обраний пішак</span>
                                </h4>
                                {selectedPos && board[selectedPos.r][selectedPos.c] ? (() => {
                                    const piece = board[selectedPos.r][selectedPos.c]!;
                                    const exp = piece.experience || 0;
                                    const lvl = Math.min(4, Math.floor(exp / 10) + 1);

                                    return (
                                        <div className="space-y-1.5 text-stone-300">
                                            <div className="font-bold text-white flex items-center justify-between">
                                                <span className="flex items-center gap-1">
                                                    <span>{piece.avatar}</span>
                                                    <span>{piece.name}</span>
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-500 text-yellow-300 font-bold">
                                                    Рівень {lvl}★
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span>Досвід: <strong className="text-amber-300 font-bold">⭐ {exp} XP</strong></span>
                                                <span className="text-[10px] text-stone-400">+{1} XP за взяття</span>
                                            </div>
                                            <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden border border-indigo-900/50">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-amber-400"
                                                    style={{ width: `${Math.min(100, (exp / 20) * 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-emerald-400 font-sans">Кожне взяття ворога дає +1 XP моментально!</p>
                                        </div>
                                    );
                                })() : (
                                    <p className="text-stone-500 italic">Оберіть пішака для переміщення або атаки.</p>
                                )}
                            </div>

                            {/* Action Log */}
                            <div className="p-3 bg-[#100b08] border border-stone-800 rounded-2xl flex-1 flex flex-col overflow-hidden min-h-[140px]">
                                <h4 className="text-[11px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider">Тактичний журнал</h4>
                                <div className="flex-1 overflow-y-auto space-y-1 text-[11px] font-mono text-stone-300">
                                    {actionLog.map((log, idx) => (
                                        <div key={idx} className="border-b border-stone-900/60 pb-0.5">{log}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 🎲 Combat Duel Floating Overlay Modal (Вспливаюче вікно двобою без зміщення шахівниці) */}
                    <AnimatePresence>
                        {combatState && (
                            <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 15 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full max-w-md bg-[#101018] border-2 border-indigo-500/80 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-2xl shadow-black/90 ring-1 ring-indigo-500/40"
                                >
                                    <div className="space-y-1">
                                        <h4 className="font-black text-indigo-300 text-sm tracking-wider uppercase flex items-center justify-center gap-2 font-serif">
                                            <Flame className="w-5 h-5 text-indigo-400 animate-bounce" />
                                            <span>⚔️ БОЙОВИЙ ДВОБІЙ ПІШАКІВ 🛡️</span>
                                        </h4>
                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                                            Атакуючий кидає кубик атаки (d20), Захисник — кубик захисту (d20)
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        {/* ATTACKER: RED DIE */}
                                        <div className={`p-3.5 rounded-2xl border transition-all ${
                                            combatState.winner === 'attacker'
                                                ? 'bg-rose-950/70 border-rose-400 shadow-lg shadow-rose-500/30 scale-105'
                                                : 'bg-stone-950/70 border-stone-800'
                                        }`}>
                                            <span className="block text-stone-300 font-bold mb-1 truncate text-xs">
                                                ⚔️ {combatState.attacker.piece.name || 'Атакуючий'}
                                            </span>
                                            
                                            <div className="my-2.5 flex flex-col items-center justify-center gap-1.5">
                                                <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black shadow-inner transition-transform ${
                                                    combatState.attackerRoll === null
                                                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-400 animate-spin'
                                                        : 'bg-rose-600 border-rose-300 text-stone-950 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110'
                                                }`}>
                                                    {combatState.attackerRoll ?? '🎲'}
                                                </div>
                                                <span className="text-[10px] font-black tracking-wider uppercase text-rose-400 mt-1">
                                                    КУБИК АТАКИ
                                                </span>
                                            </div>
                                        </div>

                                        {/* DEFENDER: BLUE/STEEL DIE */}
                                        <div className={`p-3.5 rounded-2xl border transition-all ${
                                            combatState.winner === 'defender'
                                                ? 'bg-sky-950/70 border-sky-400 shadow-lg shadow-sky-500/30 scale-105'
                                                : 'bg-stone-950/70 border-stone-800'
                                        }`}>
                                            <span className="block text-stone-300 font-bold mb-1 truncate text-xs">
                                                🛡️ {combatState.defender.piece.name || 'Захисник'}
                                            </span>

                                            <div className="my-2.5 flex flex-col items-center justify-center gap-1.5">
                                                <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black shadow-inner transition-transform ${
                                                    combatState.defenderRoll === null
                                                        ? 'bg-sky-950/40 border-sky-500/50 text-sky-400 animate-spin'
                                                        : 'bg-sky-600 border-sky-300 text-stone-950 shadow-[0_0_20px_rgba(14,165,233,0.5)] scale-110'
                                                }`}>
                                                    {combatState.defenderRoll ?? '🎲'}
                                                </div>
                                                <span className="text-[10px] font-black tracking-wider uppercase text-sky-400 mt-1">
                                                    КУБИК ЗАХИСТУ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Winner Announcement */}
                                    {combatState.winner && (
                                        <div className="text-xs font-black uppercase tracking-wider pt-1">
                                            {combatState.winner === 'attacker' ? (
                                                <span className="text-rose-300 bg-rose-950/80 border border-rose-500/50 px-4 py-1.5 rounded-full inline-block shadow-md">
                                                    💥 Успішна атака! Захисника розбито!
                                                </span>
                                            ) : (
                                                <span className="text-sky-300 bg-sky-950/80 border border-sky-500/50 px-4 py-1.5 rounded-full inline-block shadow-md">
                                                    🛡️ Атаку відбито! Захисник встояв!
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Game Result Modal */}
                    {gameResult && (
                        <div className="p-4 bg-stone-900/95 border-2 border-amber-500/60 rounded-2xl text-center space-y-3 shadow-2xl">
                            {gameResult === 'victory' ? (
                                <>
                                    <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 font-serif flex items-center justify-center gap-2">
                                        <Trophy className="w-6 h-6 text-yellow-400 animate-bounce" />
                                        <span>СЛАВЕТНА ПЕРЕМОГА!</span>
                                    </h3>
                                    <p className="text-xs text-amber-200">
                                        Ви знищили ворога або прорвалися до його ліній! Вижилі пішаки отримали <strong>+1 XP</strong>.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold text-rose-400 font-serif flex items-center justify-center gap-2">
                                        <span>💀 ПОРАЗКА</span>
                                    </h3>
                                    <p className="text-xs text-stone-300">Ворожі пішаки здолали ваше військо.</p>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    if (gameResult === 'victory') {
                                        if (onVictory) onVictory();
                                        else onClose();
                                    } else {
                                        if (onDefeat) onDefeat();
                                        else onClose();
                                    }
                                }}
                                className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black rounded-xl text-xs shadow-xl transition cursor-pointer"
                            >
                                {gameResult === 'victory' ? '🏆 Забрати нагороду та вийти' : 'Повернутися до таверни'}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

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
    RotateCcw, 
    Trophy, 
    AlertTriangle,
    Flame,
    Zap
} from 'lucide-react';
import { getFigurineRequirement, executeAutoPurchaseForActivity } from '../lib/toyAutoPurchase';

interface ToyCheckersModalProps {
    isOpen: boolean;
    boardSize?: 8 | 10 | 12;
    movementMode?: 'combat' | 'checkers_classic';
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

export interface CheckerPiece {
    id: string;
    owner: 'player' | 'opponent';
    toyId?: string;
    name: string;
    avatar: string;
    isDamka: boolean;
    experience: number;
    deaths: number;
}

export type BoardState = (CheckerPiece | null)[][];

export function ToyCheckersModal({
    isOpen,
    boardSize = 8,
    movementMode = 'combat',
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
}: ToyCheckersModalProps) {
    const pieceRows = (boardSize - 2) / 2;

    const [board, setBoard] = useState<BoardState>(() => Array(boardSize).fill(null).map(() => Array(boardSize).fill(null)));
    const boardRef = React.useRef<BoardState>(board);
    useEffect(() => {
        boardRef.current = board;
    }, [board]);

    const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
    const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent'>('player');
    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
    const [actionLog, setActionLog] = useState<string[]>([]);
    
    // Combat state for d20 duel
    const [combatState, setCombatState] = useState<{
        active: boolean;
        attacker: { piece: CheckerPiece; r: number; c: number };
        defender: { piece: CheckerPiece; r: number; c: number };
        landingPos?: { r: number; c: number };
        attackerRoll: number | null;
        defenderRoll: number | null;
        winner: 'attacker' | 'defender' | null;
    } | null>(null);

    // Only ready (not worn out 3/3) regular checkers can participate (Army checkers squads for g16 cannot play in other checker modes):
    const playerCheckers: ToySoldier[] = (progress.toySoldiers || []).filter(
        s => (s.type === 'шашка' || (s.type?.includes('шашк') && !s.isCheckersSquad && s.type !== 'шашка_загін')) && !s.isCheckersSquad && s.type !== 'шашка_загін' && (s.deaths || 0) < 3
    );
    const requiredCheckers = (boardSize * pieceRows) / 2;
    const hasEnoughCheckers = playerCheckers.length >= requiredCheckers;

    // Initialize board
    useEffect(() => {
        if (!isOpen || !hasEnoughCheckers) return;

        const newBoard: BoardState = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));

        // Opponent pieces (first pieceRows on dark squares)
        let oppIdx = 1;
        for (let r = 0; r < pieceRows; r++) {
            for (let c = 0; c < boardSize; c++) {
                if ((r + c) % 2 === 1) {
                    newBoard[r][c] = {
                        id: `opp_checker_${r}_${c}`,
                        owner: 'opponent',
                        name: `Ворожа шашка #${oppIdx++}`,
                        avatar: '⚪',
                        isDamka: false,
                        experience: 0,
                        deaths: 0
                    };
                }
            }
        }

        // Player pieces (last pieceRows on dark squares using player's actual checkers)
        let playerIdx = 0;
        const startPlayerRow = boardSize - pieceRows;
        for (let r = startPlayerRow; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if ((r + c) % 2 === 1) {
                    const soldier = playerCheckers[playerIdx];
                    if (soldier) {
                        newBoard[r][c] = {
                            id: `ply_checker_${soldier.id}`,
                            owner: 'player',
                            toyId: soldier.id,
                            name: soldier.name,
                            avatar: soldier.avatar || '🔴',
                            isDamka: false,
                            experience: soldier.experience || 0,
                            deaths: soldier.deaths || 0
                        };
                    }
                    playerIdx++;
                }
            }
        }

        setBoard(newBoard);
        setCurrentTurn('player');
        setSelectedPos(null);
        setGameResult(null);
        setCombatState(null);
        setActionLog([`🚩 Початок бою в Бойові Шашки ${boardSize}х${boardSize} проти ${opponent?.name || 'Супротивника'}!`]);
    }, [isOpen, opponent?.name, boardSize, hasEnoughCheckers]);

    if (!isOpen) return null;

    if (!hasEnoughCheckers) {
        const missingCount = Math.max(0, requiredCheckers - playerCheckers.length);
        const reqInfo = getFigurineRequirement(boardSize === 12 ? 'toy_checkers_12x12' : boardSize === 10 ? 'toy_checkers_10x10' : 'toy_checkers', progress);
        const missingCost = reqInfo?.missingCost || (missingCount === 12 ? 150 : missingCount * 15);
        const canAfford = (progress.playerGold || 0) >= missingCost;

        const handleAutoBuyCheckers = () => {
            const act = boardSize === 12 ? 'toy_checkers_12x12' : boardSize === 10 ? 'toy_checkers_10x10' : 'toy_checkers';
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
                        🔴
                    </div>

                    <div>
                        <h3 className="font-serif font-black text-xl text-amber-300">
                            Недостатньо шашок для гри!
                        </h3>
                        <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                            Для гри в <strong className="text-amber-200">«Бойові Шашки {boardSize}х{boardSize}»</strong> необхідно мати у своїй колекції <strong>{requiredCheckers} готових шашок</strong> (не зношених, &lt; 3/3 поразок).
                        </p>
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-stone-800 text-xs flex items-center justify-between">
                        <span className="text-stone-300 font-bold">Готових шашок у колекції:</span>
                        <span className={`font-black text-base px-3 py-1 rounded-xl border ${
                            playerCheckers.length >= requiredCheckers
                                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                                : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                        }`}>
                            {playerCheckers.length} / {requiredCheckers}
                        </span>
                    </div>

                    <p className="text-[11px] text-amber-400/90 italic">
                        *Зношені шашки (3/3) не можуть брати участь у грі. Скористайтеся автопокупкою або придбайте шашки в магазині!
                    </p>

                    <div className="flex flex-col gap-2 pt-2">
                        {canAfford ? (
                            <button
                                onClick={handleAutoBuyCheckers}
                                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition hover:scale-[1.02]"
                            >
                                <Zap className="w-4 h-4 fill-current" />
                                <span>⚡ Автопокупка {missingCount} шашок ({missingCost} 🪙)</span>
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

    // Get valid moves for a selected piece (accepts activeBoard or falls back to boardRef/board)
    const getValidMoves = (
        r: number, 
        c: number, 
        activeBoard?: BoardState
    ): { r: number; c: number; isAttack: boolean; defenderPos?: { r: number; c: number } }[] => {
        const b = activeBoard || boardRef.current || board;
        const piece = b[r]?.[c];
        if (!piece) return [];

        const moves: { r: number; c: number; isAttack: boolean; defenderPos?: { r: number; c: number } }[] = [];

        if (movementMode === 'checkers_classic') {
            // Classic checkers movement & capture geometry
            if (piece.isDamka) {
                // Damka (Flying King) moves along 4 diagonals
                const diags = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
                for (const [dr, dc] of diags) {
                    let step = 1;
                    let foundEnemy: { r: number; c: number } | null = null;
                    while (true) {
                        const nr = r + step * dr;
                        const nc = c + step * dc;
                        if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) break;
                        const square = b[nr]?.[nc];

                        if (!foundEnemy) {
                            if (square === null) {
                                moves.push({ r: nr, c: nc, isAttack: false });
                            } else if (square.owner !== piece.owner) {
                                foundEnemy = { r: nr, c: nc };
                            } else {
                                break; // blocked by friendly piece
                            }
                        } else {
                            if (square === null) {
                                moves.push({ r: nr, c: nc, isAttack: true, defenderPos: foundEnemy });
                            } else {
                                break; // blocked after enemy piece
                            }
                        }
                        step++;
                    }
                }
            } else {
                // Regular Checker
                // Simple moves: diagonal forward only
                const forwardDirs = piece.owner === 'player'
                    ? [[-1, -1], [-1, 1]]
                    : [[1, -1], [1, 1]];

                for (const [dr, dc] of forwardDirs) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
                        if (b[nr]?.[nc] === null) {
                            moves.push({ r: nr, c: nc, isAttack: false });
                        }
                    }
                }

                // Capturing moves: diagonal jumps in all 4 directions over enemy piece onto empty square
                const allDiags = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
                for (const [dr, dc] of allDiags) {
                    const adjR = r + dr;
                    const adjC = c + dc;
                    const landR = r + 2 * dr;
                    const landC = c + 2 * dc;

                    if (landR >= 0 && landR < boardSize && landC >= 0 && landC < boardSize) {
                        const adjPiece = b[adjR]?.[adjC];
                        const landSquare = b[landR]?.[landC];

                        if (adjPiece && adjPiece.owner !== piece.owner && landSquare === null) {
                            moves.push({ r: landR, c: landC, isAttack: true, defenderPos: { r: adjR, c: adjC } });
                        }
                    }
                }
            }
        } else {
            // Standard Combat Checkers movement
            const directions = piece.isDamka
                ? [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
                : piece.owner === 'player'
                ? [[-1, 0], [-1, -1], [-1, 1], [0, -1], [0, 1]]
                : [[1, 0], [1, -1], [1, 1], [0, -1], [0, 1]];

            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;

                if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
                    const target = b[nr]?.[nc];
                    if (!target) {
                        moves.push({ r: nr, c: nc, isAttack: false });
                    } else if (target.owner !== piece.owner) {
                        moves.push({ r: nr, c: nc, isAttack: true, defenderPos: { r: nr, c: nc } });
                    }
                }
            }
        }

        return moves;
    };

    // Execute move or attack
    const handleSquareClick = (r: number, c: number) => {
        if (currentTurn !== 'player' || combatState?.active || gameResult) return;

        const currentBoard = boardRef.current || board;
        const clickedPiece = currentBoard[r]?.[c];

        if (clickedPiece && clickedPiece.owner === 'player') {
            setSelectedPos({ r, c });
            return;
        }

        if (selectedPos) {
            const attacker = currentBoard[selectedPos.r]?.[selectedPos.c];
            if (!attacker || attacker.owner !== 'player') {
                setSelectedPos(null);
                return;
            }

            const moves = getValidMoves(selectedPos.r, selectedPos.c, currentBoard);
            // Match click either on target landing square OR on defender position
            const targetMove = moves.find(m => 
                (m.r === r && m.c === c) || 
                (m.isAttack && m.defenderPos?.r === r && m.defenderPos?.c === c)
            );

            if (targetMove) {
                if (targetMove.isAttack) {
                    // Trigger Combat Duel!
                    const defPos = targetMove.defenderPos || { r, c };
                    const defender = currentBoard[defPos.r]?.[defPos.c];
                    if (!defender || defender.owner !== 'opponent') return;

                    startCombatDuel(
                        { piece: attacker, r: selectedPos.r, c: selectedPos.c },
                        { piece: defender, r: defPos.r, c: defPos.c },
                        { r: targetMove.r, c: targetMove.c }
                    );
                } else {
                    // Simple Move
                    const newBoard = currentBoard.map(row => [...row]);
                    newBoard[selectedPos.r][selectedPos.c] = null;
                    
                    // Check promotion
                    let isPromoted = attacker.isDamka || false;
                    if (r === 0 && attacker.owner === 'player') {
                        isPromoted = true;
                    }

                    newBoard[r][c] = {
                        ...attacker,
                        isDamka: isPromoted
                    };

                    boardRef.current = newBoard;
                    setBoard(newBoard);
                    setSelectedPos(null);
                    
                    if (isPromoted && !attacker.isDamka) {
                        setActionLog(prev => [`👑 ${attacker.name || 'Шашка'} досягла краєвиду і стала ДАМКОЮ!`, ...prev.slice(0, 15)]);
                    } else {
                        setActionLog(prev => [`👟 ${attacker.name || 'Шашка'} перемістилася на (${r + 1}, ${c + 1}).`, ...prev.slice(0, 15)]);
                    }

                    // Pass turn to opponent
                    setCurrentTurn('opponent');
                    setTimeout(() => runAiTurn(newBoard), 700);
                }
            }
        }
    };

    // Start d20 Combat Duel
    const startCombatDuel = (
        attacker: { piece: CheckerPiece; r: number; c: number },
        defender: { piece: CheckerPiece; r: number; c: number },
        landingPos?: { r: number; c: number }
    ) => {
        if (!attacker?.piece || !defender?.piece) return;

        setCombatState({
            active: true,
            attacker,
            defender,
            landingPos,
            attackerRoll: null,
            defenderRoll: null,
            winner: null
        });

        playDiceRollSound();

        setTimeout(() => {
            const atkBonus = attacker.piece?.isDamka ? 1 : 0;
            const defBonus = defender.piece?.isDamka ? 1 : 0;

            const aRoll = Math.floor(Math.random() * 20) + 1 + atkBonus;
            const dRoll = Math.floor(Math.random() * 20) + 1 + defBonus;

            const isAttackerWinner = aRoll >= dRoll;

            setCombatState(prev => prev ? {
                ...prev,
                attackerRoll: aRoll,
                defenderRoll: dRoll,
                winner: isAttackerWinner ? 'attacker' : 'defender'
            } : null);

            setTimeout(() => {
                resolveCombatDuel(attacker, defender, isAttackerWinner, landingPos);
            }, 1200);
        }, 800);
    };

    // Resolve combat outcome
    const resolveCombatDuel = (
        attacker: { piece: CheckerPiece; r: number; c: number },
        defender: { piece: CheckerPiece; r: number; c: number },
        attackerWon: boolean,
        landingPos?: { r: number; c: number }
    ) => {
        if (!attacker?.piece || !defender?.piece) return;
        const baseBoard = boardRef.current || board;
        const newBoard = baseBoard.map(row => [...row]);

        if (attackerWon) {
            // Defender destroyed, attacker steps on landing square (or defender square)
            newBoard[attacker.r][attacker.c] = null;
            newBoard[defender.r][defender.c] = null;
            
            const landR = landingPos ? landingPos.r : defender.r;
            const landC = landingPos ? landingPos.c : defender.c;

            let isPromoted = attacker.piece?.isDamka || false;
            if (attacker.piece?.owner === 'player' && landR === 0) isPromoted = true;
            if (attacker.piece?.owner === 'opponent' && landR === boardSize - 1) isPromoted = true;

            newBoard[landR][landC] = {
                ...attacker.piece,
                isDamka: isPromoted,
                experience: attacker.piece?.owner === 'player' ? (attacker.piece.experience || 0) + 1 : (attacker.piece?.experience || 0)
            };

            const isPlayerDefender = defender.piece?.owner === 'player';
            if (isPlayerDefender && defender.piece?.toyId) {
                const lostToyId = defender.piece.toyId;
                const updatedSoldiers = (progress.toySoldiers || []).map(s => {
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
                `⚔️ ${attacker.piece?.name || 'Шашка'} переміг ${defender.piece?.name || 'Шашку'} в двобої!${isPlayerDefender ? ' 💥 Побита шашка отримала 1 поломку!' : ''}`,
                ...prev.slice(0, 15)
            ]);
        } else {
            // Attacker lost the duel: defender defended! Attacker and defender stay in their positions, turn passes.
            setActionLog(prev => [
                `🛡️ ${defender.piece?.name || 'Шашка'} відбив атаку ${attacker.piece?.name || 'Шашки'}! Обидві шашки залишаються на місцях.`,
                ...prev.slice(0, 15)
            ]);
        }

        boardRef.current = newBoard;
        setBoard(newBoard);
        setCombatState(null);
        setSelectedPos(null);

        // Check victory/defeat condition
        checkGameEnd(newBoard, attacker.piece?.owner === 'player' ? 'opponent' : 'player');
    };

    // AI Turn
    const runAiTurn = (currentBoardInput?: BoardState) => {
        const currentBoard = currentBoardInput || boardRef.current || board;
        const aiPieces: { r: number; c: number; piece: CheckerPiece }[] = [];
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (currentBoard[r][c]?.owner === 'opponent') {
                    aiPieces.push({ r, c, piece: currentBoard[r][c]! });
                }
            }
        }

        if (aiPieces.length === 0) {
            handleVictory(currentBoard);
            return;
        }

        // Collect all valid AI moves evaluated strictly on currentBoard
        const validMoves: { from: { r: number; c: number }; to: { r: number; c: number; isAttack: boolean; defenderPos?: { r: number; c: number } }; piece: CheckerPiece }[] = [];
        for (const ai of aiPieces) {
            const moves = getValidMoves(ai.r, ai.c, currentBoard);
            for (const m of moves) {
                validMoves.push({ from: { r: ai.r, c: ai.c }, to: m, piece: ai.piece });
            }
        }

        if (validMoves.length === 0) {
            handleVictory(currentBoard);
            return;
        }

        // AI Smart Heuristic: score each move for tactical advantage, safety, crowning, and piece preservation
        const evaluateAiMove = (candidate: typeof validMoves[0], curBoard: BoardState): number => {
            let score = 0;
            const { from, to, piece } = candidate;

            if (to.isAttack) {
                score += 35; // Base attack reward
                const defPos = to.defenderPos || { r: to.r, c: to.c };
                const defender = curBoard[defPos.r]?.[defPos.c];

                if (piece.isDamka) score += 12; // Damka has attack bonus
                if (defender?.isDamka) score += 30; // Eliminating a player Damka is high priority!

                // If attack also promotes piece to Damka
                if (to.r === boardSize - 1 && !piece.isDamka) {
                    score += 40;
                }

                // Check if other player pieces can counter-attack the landing square
                let landingThreatened = false;
                for (let r = 0; r < boardSize; r++) {
                    for (let c = 0; c < boardSize; c++) {
                        if (curBoard[r][c]?.owner === 'player' && (r !== defPos.r || c !== defPos.c)) {
                            const pMoves = getValidMoves(r, c, curBoard);
                            if (pMoves.some(pm => pm.r === to.r && pm.c === to.c)) {
                                landingThreatened = true;
                                break;
                            }
                        }
                    }
                    if (landingThreatened) break;
                }
                if (landingThreatened) {
                    score -= piece.isDamka ? 35 : 18;
                }
            } else {
                // Simple move
                // Crowning move priority
                if (to.r === boardSize - 1 && !piece.isDamka) {
                    score += 50;
                }

                // Preserve back rank (row 0)
                if (from.r === 0 && !piece.isDamka) {
                    const playerNearby = curBoard.some((row, rIdx) => 
                        rIdx <= 4 && row.some(p => p && p.owner === 'player')
                    );
                    if (playerNearby) score -= 18;
                }

                // Center control
                const centerMin = Math.floor(boardSize / 4);
                const centerMax = boardSize - centerMin - 1;
                if (to.c >= centerMin && to.c <= centerMax) score += 6;
                if (to.c === 0 || to.c === boardSize - 1) score += 4; // Edge safety

                // Advancement towards promotion
                if (!piece.isDamka) {
                    score += (to.r - from.r) * 5;
                } else {
                    // Damka hunting closest player piece
                    let minPlayerDist = 99;
                    for (let r = 0; r < boardSize; r++) {
                        for (let c = 0; c < boardSize; c++) {
                            if (curBoard[r][c]?.owner === 'player') {
                                const d = Math.abs(to.r - r) + Math.abs(to.c - c);
                                if (d < minPlayerDist) minPlayerDist = d;
                            }
                        }
                    }
                    score += Math.max(0, 16 - minPlayerDist);
                }

                // TACTICAL SAFETY: Does moving to `to` blunder into immediate attack by player?
                let threatened = false;
                for (let r = 0; r < boardSize; r++) {
                    for (let c = 0; c < boardSize; c++) {
                        if (curBoard[r][c]?.owner === 'player') {
                            const pMoves = getValidMoves(r, c, curBoard);
                            if (pMoves.some(pm => pm.r === to.r && pm.c === to.c)) {
                                threatened = true;
                                break;
                            }
                        }
                    }
                    if (threatened) break;
                }

                if (threatened) {
                    score -= piece.isDamka ? 70 : 40;
                }
            }

            return score;
        };

        // Sort moves by tactical evaluation
        const sortedMoves = [...validMoves].sort((a, b) => 
            evaluateAiMove(b, currentBoard) - evaluateAiMove(a, currentBoard)
        );

        let selectedCandidate = sortedMoves[0];

        // Validate attack target on current board
        if (selectedCandidate.to.isAttack) {
            const defPos = selectedCandidate.to.defenderPos || { r: selectedCandidate.to.r, c: selectedCandidate.to.c };
            const defender = currentBoard[defPos.r]?.[defPos.c];
            const attackerPiece = currentBoard[selectedCandidate.from.r]?.[selectedCandidate.from.c];

            if (defender && defender.owner === 'player' && attackerPiece && attackerPiece.owner === 'opponent') {
                startCombatDuel(
                    { piece: attackerPiece, r: selectedCandidate.from.r, c: selectedCandidate.from.c },
                    { piece: defender, r: defPos.r, c: defPos.c },
                    { r: selectedCandidate.to.r, c: selectedCandidate.to.c }
                );
                return;
            } else {
                // If attack target is no longer valid, fallback to first valid simple move
                const fallbackMove = sortedMoves.find(m => !m.to.isAttack && currentBoard[m.to.r]?.[m.to.c] === null);
                if (fallbackMove) {
                    selectedCandidate = fallbackMove;
                } else {
                    // Turn safely passes to player if no execution candidate
                    setCurrentTurn('player');
                    return;
                }
            }
        }

        // Execute simple move
        const attackerPiece = currentBoard[selectedCandidate.from.r]?.[selectedCandidate.from.c];
        if (!attackerPiece || currentBoard[selectedCandidate.to.r]?.[selectedCandidate.to.c] !== null) {
            setCurrentTurn('player');
            return;
        }

        const newBoard = currentBoard.map(row => [...row]);
        newBoard[selectedCandidate.from.r][selectedCandidate.from.c] = null;

        let isPromoted = attackerPiece.isDamka || false;
        if (selectedCandidate.to.r === boardSize - 1) isPromoted = true;

        newBoard[selectedCandidate.to.r][selectedCandidate.to.c] = {
            ...attackerPiece,
            isDamka: isPromoted
        };

        boardRef.current = newBoard;
        setBoard(newBoard);
        setActionLog(prev => [`🤖 Ворожа ${attackerPiece.name || 'шашка'} перемістилася.`, ...prev.slice(0, 15)]);

        checkGameEnd(newBoard, 'player');
    };

    // Check game end conditions
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
        } else if (playerAlive === 0) {
            handleDefeat();
        } else {
            setCurrentTurn(nextTurn);
            if (nextTurn === 'opponent') {
                setTimeout(() => runAiTurn(currentBoard), 600);
            }
        }
    };

    // Victory Handler
    const handleVictory = (finalBoard: BoardState) => {
        setGameResult('victory');
        playVictorySound();

        // Award +1 XP to all surviving player checkers on board
        const survivingToyIds = new Set<string>();
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const p = finalBoard[r][c];
                if (p && p.owner === 'player' && p.toyId) {
                    survivingToyIds.add(p.toyId);
                }
            }
        }

        const updatedSoldiers = (progress.toySoldiers || []).map(s => {
            if (survivingToyIds.has(s.id)) {
                const newXp = (s.experience || 0) + 1;
                return {
                    ...s,
                    experience: newXp
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
                            <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xl">
                                🔴
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-amber-200 font-serif flex items-center gap-2">
                                    <span>{movementMode === 'checkers_classic' ? `Шашкові Бойові Шашки ${boardSize}х${boardSize}` : `Бойові Шашки ${boardSize}х${boardSize}`}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 border border-amber-600/40 text-amber-300 font-sans">
                                        {movementMode === 'checkers_classic' ? 'Шашкові Ходи • d20' : 'd20 Двобої'}
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
                        {/* Left: Checkerboard */}
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
                                        const isDarkSquare = (r + c) % 2 === 1;
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
                                                        : isDarkSquare
                                                        ? 'bg-[#211610]'
                                                        : 'bg-[#3b2b20]'
                                                }`}
                                            >
                                                {cell && (
                                                    <div
                                                        className={`w-4/5 h-4/5 rounded-full flex items-center justify-center text-sm shadow-md transition-transform ${
                                                            cell.owner === 'player'
                                                                ? 'bg-gradient-to-b from-rose-600 to-red-800 border-2 border-rose-300 text-white'
                                                                : 'bg-gradient-to-b from-stone-200 to-stone-400 border-2 border-white text-stone-900'
                                                        }`}
                                                    >
                                                        <span>{cell.avatar}</span>
                                                        {cell.isDamka && (
                                                             <Crown className="w-3.5 h-3.5 absolute -top-1 -right-1 text-yellow-300 fill-yellow-400 drop-shadow" />
                                                        )}
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
                            {/* Selected Piece Info */}
                            <div className="p-3 bg-[#1e1712] border border-amber-900/40 rounded-2xl text-xs space-y-1.5">
                                <h4 className="font-bold text-amber-200 font-serif flex items-center gap-1.5">
                                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Обрана шашка</span>
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
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-500 text-yellow-300 font-bold">
                                                    Рівень {lvl}★
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span>Досвід: <strong className="text-amber-300 font-bold">⭐ {exp} XP</strong></span>
                                                <span className="text-[10px] text-stone-400">+{1} XP за двобій</span>
                                            </div>
                                            <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden border border-amber-900/50">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-purple-500 to-amber-400"
                                                    style={{ width: `${Math.min(100, (exp / 20) * 100)}%` }}
                                                />
                                            </div>
                                            <div className="text-[11px]">
                                                Статус: {piece.isDamka ? '👑 ДАМКА (+1 АТК/+1 ЗАХ)' : 'Звичайна шашка'}
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <p className="text-stone-500 italic">Натисніть на свою шашку для перегляду та ходу.</p>
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
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 15 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full max-w-md bg-[#160d12] border-2 border-rose-500/80 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-2xl shadow-black/90 ring-1 ring-rose-500/40"
                                >
                                    <div className="space-y-1">
                                        <h4 className="font-black text-rose-300 text-sm tracking-wider uppercase flex items-center justify-center gap-2 font-serif">
                                            <Flame className="w-5 h-5 text-rose-400 animate-bounce" />
                                            <span>⚔️ БОЙОВИЙ ДВОБІЙ ШАШОК 🛡️</span>
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
                                                ⚔️ {combatState.attacker?.piece?.name || 'Атакуючий'}
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

                                            {combatState.attacker?.piece?.isDamka && (
                                                <span className="inline-block text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mt-1 border border-amber-600/40">
                                                    👑 Дамка (+1)
                                                </span>
                                            )}
                                        </div>

                                        {/* DEFENDER: BLUE/STEEL DIE */}
                                        <div className={`p-3.5 rounded-2xl border transition-all ${
                                            combatState.winner === 'defender'
                                                ? 'bg-sky-950/70 border-sky-400 shadow-lg shadow-sky-500/30 scale-105'
                                                : 'bg-stone-950/70 border-stone-800'
                                        }`}>
                                            <span className="block text-stone-300 font-bold mb-1 truncate text-xs">
                                                🛡️ {combatState.defender?.piece?.name || 'Захисник'}
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

                                            {combatState.defender?.piece?.isDamka && (
                                                <span className="inline-block text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider mt-1 border border-amber-600/40">
                                                    👑 Дамка (+1)
                                                </span>
                                            )}
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
                                        Ви розбили військо шашок суперника! Усі вижилі бойові шашки отримали <strong>+1 очко досвіду (XP)</strong>.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold text-rose-400 font-serif flex items-center justify-center gap-2">
                                        <span>💀 ПОРАЗКА</span>
                                    </h3>
                                    <p className="text-xs text-stone-300">Ваші шашки були розбиті в бою.</p>
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

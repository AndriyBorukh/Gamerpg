import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { OpponentData, WorldProgress, ToySoldier } from '../types';
import { saveWorldProgress } from '../lib/worldData';
import { getFigurineRequirement, executeAutoPurchaseForActivity } from '../lib/toyAutoPurchase';
import { X, Sparkles, Trophy, ShoppingBag, RotateCcw, Crown, Shield, Zap, Swords, ArrowUp, ArrowDown, HelpCircle, User, Bot, Flame } from 'lucide-react';
import { WizardBattleModal } from './WizardBattleModal';

interface MagicPawnsModalProps {
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

export interface MagicPawnPiece {
    id: string;
    side: 'player' | 'opponent';
    hp: number; // 2 HP max
    toySoldierId?: string;
    name: string;
    avatar: string;
}

type BoardState = (MagicPawnPiece | null)[][];

export function MagicPawnsModal({
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
}: MagicPawnsModalProps) {
    const pieceRows = (boardSize - 2) / 2;
    const requiredPawns = pieceRows * boardSize;
    const columns = Array.from({ length: boardSize }, (_, i) => String.fromCharCode(65 + i));

    const [board, setBoard] = useState<BoardState>(() => Array(boardSize).fill(null).map(() => Array(boardSize).fill(null)));
    const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
    const [lastMove, setLastMove] = useState<{ from: { r: number; c: number }; to: { r: number; c: number } } | null>(null);
    const [turn, setTurn] = useState<'player' | 'opponent'>('player');
    const [battleLogs, setBattleLogs] = useState<string[]>([]);
    const [gameOver, setGameOver] = useState<'victory' | 'defeat' | null>(null);
    const [showRules, setShowRules] = useState(false);

    // Active Pawn-vs-Pawn Wizard Battle Overlay
    const [activeWizardDuel, setActiveWizardDuel] = useState<{
        attackerPos: { r: number; c: number };
        defenderPos: { r: number; c: number };
        attackerPiece: MagicPawnPiece;
        defenderPiece: MagicPawnPiece;
    } | null>(null);

    // Filter player's magic pawns or generic pawns from inventory (deaths < 3)
    const playerMagicPawnsInInventory = (progress.toySoldiers || []).filter(
        s => (s.type === 'магічний_пішак' || s.type === 'пішак') && (s.deaths || 0) < 3
    );
    const requiredMagicPawns = boardSize * pieceRows;
    const hasEnoughMagicPawns = playerMagicPawnsInInventory.length >= requiredMagicPawns;

    // Setup Board with pieceRows of Pawns per side
    useEffect(() => {
        if (!isOpen || !hasEnoughMagicPawns) return;
        initBoard();
    }, [isOpen, boardSize, hasEnoughMagicPawns]);

    const initBoard = () => {
        const newBoard: BoardState = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));

        // Opponent Pawns
        let oppCounter = 1;
        for (let r = 0; r < pieceRows; r++) {
            for (let c = 0; c < boardSize; c++) {
                newBoard[r][c] = {
                    id: `opp_pawn_${r}_${c}`,
                    side: 'opponent',
                    hp: 2,
                    name: `Темний пішак #${oppCounter++}`,
                    avatar: '🧙🏿‍♂️'
                };
            }
        }

        // Player Pawns
        let pawnIdx = 0;
        const startPlayerRow = boardSize - pieceRows;
        for (let r = startPlayerRow; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const invItem = playerMagicPawnsInInventory[pawnIdx];
                if (invItem) {
                    const startHp = invItem?.hp !== undefined ? Math.max(1, Math.min(2, invItem.hp)) : 2;
                    newBoard[r][c] = {
                        id: invItem.id,
                        side: 'player',
                        hp: startHp,
                        toySoldierId: invItem.id,
                        name: invItem.name,
                        avatar: invItem.avatar || '🧙‍♂️'
                    };
                }
                pawnIdx++;
            }
        }

        setBoard(newBoard);
        setSelectedPos(null);
        setLastMove(null);
        setTurn('player');
        setGameOver(null);
        setActiveWizardDuel(null);
        setBattleLogs([`✨ Битва в Магічні Бойові Пішаки ${boardSize}х${boardSize} розпочалась!`]);
    };

    if (!isOpen) return null;

    if (!hasEnoughMagicPawns) {
        const missingCount = Math.max(0, requiredMagicPawns - playerMagicPawnsInInventory.length);
        const act = boardSize === 12 ? 'magic_pawns_12x12' : boardSize === 10 ? 'magic_pawns_10x10' : 'magic_pawns';
        const reqInfo = getFigurineRequirement(act, progress);
        const missingCost = reqInfo?.missingCost || (missingCount * 20);
        const canAfford = (progress.playerGold || 0) >= missingCost;

        const handleAutoBuyMagicPawns = () => {
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
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-950/80 border-2 border-purple-500/50 flex items-center justify-center text-3xl shadow-inner">
                        🔮
                    </div>

                    <div>
                        <h3 className="font-serif font-black text-xl text-amber-300">
                            Недостатньо магічних пішаків для гри!
                        </h3>
                        <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                            Для гри в <strong className="text-amber-200">«Магічні Бойові Пішаки {boardSize}х{boardSize}»</strong> необхідно мати у своїй колекції <strong>{requiredMagicPawns} готових пішаків</strong> (не зношених, &lt; 3/3 поразок).
                        </p>
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-stone-800 text-xs flex items-center justify-between">
                        <span className="text-stone-300 font-bold">Готових пішаків у колекції:</span>
                        <span className={`font-black text-base px-3 py-1 rounded-xl border ${
                            playerMagicPawnsInInventory.length >= requiredMagicPawns
                                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                                : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                        }`}>
                            {playerMagicPawnsInInventory.length} / {requiredMagicPawns}
                        </span>
                    </div>

                    <p className="text-[11px] text-amber-400/90 italic">
                        *Зношені пішаки (3/3) не можуть брати участь у грі. Скористайтеся автопокупкою або придбайте пішаки в магазині!
                    </p>

                    <div className="flex flex-col gap-2 pt-2">
                        {canAfford ? (
                            <button
                                onClick={handleAutoBuyMagicPawns}
                                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition hover:scale-[1.02]"
                            >
                                <Zap className="w-4 h-4 fill-current" />
                                <span>⚡ Автопокупка {missingCount} маг. пішаків ({missingCost} 🪙)</span>
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

    // Count alive pawns
    const countPawns = () => {
        let player = 0;
        let opponent = 0;
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c]?.side === 'player') player++;
                if (board[r][c]?.side === 'opponent') opponent++;
            }
        }
        return { player, opponent };
    };

    const pawnCounts = countPawns();

    // Calculate valid moves for selected pawn
    const getValidMoves = (r: number, c: number) => {
        const piece = board[r][c];
        if (!piece) return [];
        const moves: { r: number; c: number; isAttack: boolean }[] = [];

        const dir = piece.side === 'player' ? -1 : 1; // Player moves UP (-1), Opponent moves DOWN (+1)

        // 1. Move forward 1 step if empty
        const fr = r + dir;
        if (fr >= 0 && fr < boardSize && !board[fr][c]) {
            moves.push({ r: fr, c, isAttack: false });
        }

        // 2. Diagonal captures if enemy present
        [-1, 1].forEach(dc => {
            const fc = c + dc;
            if (fr >= 0 && fr < boardSize && fc >= 0 && fc < boardSize) {
                const target = board[fr][fc];
                if (target && target.side !== piece.side) {
                    moves.push({ r: fr, c: fc, isAttack: true });
                }
            }
        });

        return moves;
    };

    const handleSquareClick = (r: number, c: number) => {
        if (gameOver || turn !== 'player' || activeWizardDuel) return;

        const clickedPiece = board[r][c];

        // If clicking own piece, select it
        if (clickedPiece && clickedPiece.side === 'player') {
            if (selectedPos?.r === r && selectedPos?.c === c) {
                setSelectedPos(null); // toggle deselect
            } else {
                setSelectedPos({ r, c });
            }
            return;
        }

        // If a piece is selected, check if clicking a valid move
        if (selectedPos) {
            const moves = getValidMoves(selectedPos.r, selectedPos.c);
            const targetMove = moves.find(m => m.r === r && m.c === c);

            if (targetMove) {
                executeMove(selectedPos, { r, c }, targetMove.isAttack);
            } else {
                // Clicked an invalid tile, deselect
                setSelectedPos(null);
            }
        }
    };

    const executeMove = (
        from: { r: number; c: number },
        to: { r: number; c: number },
        isAttack: boolean
    ) => {
        const attacker = board[from.r][from.c];
        if (!attacker) return;

        if (isAttack) {
            const defender = board[to.r][to.c];
            if (!defender) return;

            // Trigger Wizard Duel Overlay!
            setActiveWizardDuel({
                attackerPos: from,
                defenderPos: to,
                attackerPiece: attacker,
                defenderPiece: defender
            });
        } else {
            // Simple non-attack move
            const newBoard = board.map(row => [...row]);
            newBoard[to.r][to.c] = attacker;
            newBoard[from.r][from.c] = null;
            setBoard(newBoard);
            setSelectedPos(null);
            setLastMove({ from, to });

            const colName = String.fromCharCode(65 + to.c);
            const rowName = boardSize - to.r;
            setBattleLogs(prev => [`🔵 ${attacker.name} просунувся вперед на ${colName}${rowName}`, ...prev]);

            // Check if player reached back row (row 0)
            if (attacker.side === 'player' && to.r === 0) {
                handleVictory(`👑 ${attacker.name} дістався до крайньої лінії ворога на полі ${colName}${rowName}!`);
                return;
            }

            // Switch turn to AI opponent
            setTurn('opponent');
            setTimeout(() => triggerAiTurn(newBoard), 600);
        }
    };

    // Wizard Battle Duel Resolution Callback
    const handleWizardDuelResolution = (
        winnerSide: 'attacker' | 'defender',
        finalPlayerHp?: number,
        finalOppHp?: number
    ) => {
        if (!activeWizardDuel) return;

        const { attackerPos, defenderPos, attackerPiece, defenderPiece } = activeWizardDuel;
        const newBoard = board.map(row => [...row]);
        const isPlayerAttacking = attackerPiece.side === 'player';

        const attackerFinalHp = isPlayerAttacking
            ? (finalPlayerHp !== undefined ? finalPlayerHp : attackerPiece.hp)
            : (finalOppHp !== undefined ? finalOppHp : attackerPiece.hp);
        const defenderFinalHp = isPlayerAttacking
            ? (finalOppHp !== undefined ? finalOppHp : defenderPiece.hp)
            : (finalPlayerHp !== undefined ? finalPlayerHp : defenderPiece.hp);

        if (winnerSide === 'attacker') {
            // Attacker won: defender eliminated, attacker moves to defender position with remaining HP
            const survivingAttacker: MagicPawnPiece = {
                ...attackerPiece,
                hp: Math.max(1, Math.min(2, attackerFinalHp))
            };
            newBoard[defenderPos.r][defenderPos.c] = survivingAttacker;
            newBoard[attackerPos.r][attackerPos.c] = null;
            setBoard(newBoard);
            setLastMove({ from: attackerPos, to: defenderPos });

            const colName = String.fromCharCode(65 + defenderPos.c);
            const rowName = boardSize - defenderPos.r;

            setBattleLogs(prev => [
                `💥 ${isPlayerAttacking ? '🔵' : '🔴'} ${attackerPiece.name} переміг у чаклунській дуелі (${survivingAttacker.hp}/2 HP) та знищив ${defenderPiece.name} на ${colName}${rowName}!`,
                ...prev
            ]);

            // If defender was player's piece, record death
            if (defenderPiece.side === 'player' && defenderPiece.toySoldierId) {
                recordDeathToSoldier(defenderPiece.toySoldierId);
            }

            // Award XP and persist HP to player piece if it was player's attacker
            if (attackerPiece.side === 'player' && attackerPiece.toySoldierId) {
                updateSoldierHpAndXp(attackerPiece.toySoldierId, survivingAttacker.hp, 1);
            }

            // Check if player reached opponent baseline (row 0)
            if (attackerPiece.side === 'player' && defenderPos.r === 0) {
                setActiveWizardDuel(null);
                handleVictory(`👑 ${attackerPiece.name} захопив крайню лінію ворога!`, newBoard);
                return;
            }

            // Check if opponent reached player baseline (row boardSize - 1)
            if (attackerPiece.side === 'opponent' && defenderPos.r === boardSize - 1) {
                setActiveWizardDuel(null);
                handleDefeat(`💀 Ворожий темний пішак пробився до вашої бази!`, newBoard);
                return;
            }

            // Check if all pieces of either side are destroyed
            let oppRemaining = 0;
            let playerRemaining = 0;
            for (let r = 0; r < boardSize; r++) {
                for (let c = 0; c < boardSize; c++) {
                    if (newBoard[r][c]?.side === 'opponent') oppRemaining++;
                    if (newBoard[r][c]?.side === 'player') playerRemaining++;
                }
            }
            if (oppRemaining === 0) {
                setActiveWizardDuel(null);
                handleVictory(`🏆 Всі темні пішаки супротивника знищені!`, newBoard);
                return;
            }
            if (playerRemaining === 0) {
                setActiveWizardDuel(null);
                handleDefeat(`💀 Всі ваші світлі пішаки загинули в бою...`, newBoard);
                return;
            }

        } else {
            // Defender won: attacker eliminated, defender stays on position with remaining HP
            const survivingDefender: MagicPawnPiece = {
                ...defenderPiece,
                hp: Math.max(1, Math.min(2, defenderFinalHp))
            };
            newBoard[attackerPos.r][attackerPos.c] = null;
            newBoard[defenderPos.r][defenderPos.c] = survivingDefender;
            setBoard(newBoard);
            setLastMove({ from: attackerPos, to: attackerPos });

            setBattleLogs(prev => [
                `🛡️ ${isPlayerAttacking ? '🔴' : '🔵'} ${defenderPiece.name} успішно відбив атаку (${survivingDefender.hp}/2 HP)! ${attackerPiece.name} знищено!`,
                ...prev
            ]);

            // Update death count if player piece was destroyed, or update HP/XP if player piece defended
            if (attackerPiece.side === 'player' && attackerPiece.toySoldierId) {
                recordDeathToSoldier(attackerPiece.toySoldierId);
            }
            if (defenderPiece.side === 'player' && defenderPiece.toySoldierId) {
                updateSoldierHpAndXp(defenderPiece.toySoldierId, survivingDefender.hp, 1);
            }

            // Check if all pieces of either side are destroyed
            let oppRemaining = 0;
            let playerRemaining = 0;
            for (let r = 0; r < boardSize; r++) {
                for (let c = 0; c < boardSize; c++) {
                    if (newBoard[r][c]?.side === 'opponent') oppRemaining++;
                    if (newBoard[r][c]?.side === 'player') playerRemaining++;
                }
            }
            if (oppRemaining === 0) {
                setActiveWizardDuel(null);
                handleVictory(`🏆 Всі темні пішаки супротивника знищені!`, newBoard);
                return;
            }
            if (playerRemaining === 0) {
                setActiveWizardDuel(null);
                handleDefeat(`💀 Всі ваші світлі пішаки загинули в бою...`, newBoard);
                return;
            }
        }

        setActiveWizardDuel(null);
        setSelectedPos(null);

        // Switch turn
        const nextTurn = attackerPiece.side === 'player' ? 'opponent' : 'player';
        setTurn(nextTurn);

        if (nextTurn === 'opponent') {
            setTimeout(() => triggerAiTurn(newBoard), 600);
        }
    };

    // AI Turn Logic
    const triggerAiTurn = (currentBoard: BoardState) => {
        // Collect all possible moves for AI pawns
        const aiMoves: { from: { r: number; c: number }; to: { r: number; c: number }; isAttack: boolean }[] = [];

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const p = currentBoard[r][c];
                if (p && p.side === 'opponent') {
                    const dir = 1; // moves down
                    const fr = r + dir;
                    if (fr >= 0 && fr < boardSize && !currentBoard[fr][c]) {
                        aiMoves.push({ from: { r, c }, to: { r: fr, c }, isAttack: false });
                    }
                    [-1, 1].forEach(dc => {
                        const fc = c + dc;
                        if (fr >= 0 && fr < boardSize && fc >= 0 && fc < boardSize) {
                            const target = currentBoard[fr][fc];
                            if (target && target.side === 'player') {
                                aiMoves.push({ from: { r, c }, to: { r: fr, c: fc }, isAttack: true });
                            }
                        }
                    });
                }
            }
        }

        if (aiMoves.length === 0) {
            handleVictory(`🏆 Супротивник не має можливих ходів!`);
            return;
        }

        // Prioritize attack moves, otherwise advance forward closest to baseline
        const attacks = aiMoves.filter(m => m.isAttack);
        let chosenMove;
        if (attacks.length > 0) {
            chosenMove = attacks[Math.floor(Math.random() * attacks.length)];
        } else {
            // Sort by highest row to press forward
            aiMoves.sort((a, b) => b.to.r - a.to.r);
            chosenMove = aiMoves[Math.floor(Math.random() * Math.min(3, aiMoves.length))];
        }

        if (chosenMove.isAttack) {
            const attacker = currentBoard[chosenMove.from.r][chosenMove.from.c]!;
            const defender = currentBoard[chosenMove.to.r][chosenMove.to.c]!;

            setActiveWizardDuel({
                attackerPos: chosenMove.from,
                defenderPos: chosenMove.to,
                attackerPiece: attacker,
                defenderPiece: defender
            });
        } else {
            const attacker = currentBoard[chosenMove.from.r][chosenMove.from.c]!;
            const newBoard = currentBoard.map(row => [...row]);
            newBoard[chosenMove.to.r][chosenMove.to.c] = attacker;
            newBoard[chosenMove.from.r][chosenMove.from.c] = null;
            setBoard(newBoard);
            setLastMove({ from: chosenMove.from, to: chosenMove.to });

            const colName = String.fromCharCode(65 + chosenMove.to.c);
            const rowName = boardSize - chosenMove.to.r;
            setBattleLogs(prev => [`🔴 ${attacker.name} просунувся вперед на ${colName}${rowName}`, ...prev]);

            // Check if AI reached player baseline (row boardSize - 1)
            if (chosenMove.to.r === boardSize - 1) {
                handleDefeat(`💀 Темний пішак ворога досяг вашої лінії оборони на ${colName}${rowName}!`);
                return;
            }

            setTurn('player');
        }
    };

    const updateSoldierHpAndXp = (soldierId: string, currentHp: number, amount: number = 0) => {
        const updatedSoldiers = (progress.toySoldiers || []).map(s => {
            if (s.id === soldierId) {
                const newXp = s.experience + amount;
                const newLevel = Math.min(4, Math.floor(newXp / 10));
                return { ...s, hp: Math.max(1, Math.min(2, currentHp)), experience: newXp, level: newLevel };
            }
            return s;
        });

        const newProg = { ...progress, toySoldiers: updatedSoldiers };
        onUpdateProgress(newProg);
    };

    const recordDeathToSoldier = (soldierId: string) => {
        const updatedSoldiers = (progress.toySoldiers || []).map(s => {
            if (s.id === soldierId) {
                return { ...s, deaths: s.deaths + 1, hp: 2 };
            }
            return s;
        });

        const newProg = { ...progress, toySoldiers: updatedSoldiers };
        onUpdateProgress(newProg);
    };

    const handleVictory = (reason: string, currentBoard: BoardState = board) => {
        setGameOver('victory');
        setBattleLogs(prev => [`🎉 ПЕРЕМОГА! ${reason}`, ...prev]);

        // Sync HP & award victory XP to all surviving player pawns on board
        const survivingHpMap = new Map<string, number>();
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const p = currentBoard[r][c];
                if (p && p.side === 'player' && p.toySoldierId) {
                    survivingHpMap.set(p.toySoldierId, p.hp);
                }
            }
        }

        if (survivingHpMap.size > 0) {
            const updatedSoldiers = (progress.toySoldiers || []).map(s => {
                if (survivingHpMap.has(s.id)) {
                    const finalHp = survivingHpMap.get(s.id)!;
                    const newXp = s.experience + 1;
                    const newLevel = Math.min(4, Math.floor(newXp / 10));
                    return { ...s, hp: finalHp, experience: newXp, level: newLevel };
                }
                return s;
            });
            onUpdateProgress({ ...progress, toySoldiers: updatedSoldiers });
        }

        if (onVictory) onVictory();
    };

    const handleDefeat = (reason: string, currentBoard: BoardState = board) => {
        setGameOver('defeat');
        setBattleLogs(prev => [`💀 ПОРАЗКА! ${reason}`, ...prev]);

        // Sync HP for surviving player pawns even on defeat
        const survivingHpMap = new Map<string, number>();
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                const p = currentBoard[r][c];
                if (p && p.side === 'player' && p.toySoldierId) {
                    survivingHpMap.set(p.toySoldierId, p.hp);
                }
            }
        }

        if (survivingHpMap.size > 0) {
            const updatedSoldiers = (progress.toySoldiers || []).map(s => {
                if (survivingHpMap.has(s.id)) {
                    const finalHp = survivingHpMap.get(s.id)!;
                    return { ...s, hp: finalHp };
                }
                return s;
            });
            onUpdateProgress({ ...progress, toySoldiers: updatedSoldiers });
        }

        if (onDefeat) onDefeat();
    };

    if (!isOpen) return null;

    const validMoves = selectedPos ? getValidMoves(selectedPos.r, selectedPos.c) : [];
    const selectedPiece = selectedPos ? board[selectedPos.r][selectedPos.c] : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
            <div className="relative w-full max-w-4xl bg-gradient-to-b from-stone-900 via-stone-950 to-neutral-950 border-2 border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-950/80 via-stone-900 to-rose-950/80 border-b border-indigo-500/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600/30 border border-indigo-400/40 rounded-xl">
                            <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-indigo-200 to-rose-200 tracking-wide font-serif">
                                🧙‍♂️ Магічні Бойові Пішаки {boardSize}х{boardSize}
                            </h2>
                            <p className="text-xs text-stone-300">
                                Чіткий поділ: <span className="text-cyan-300 font-bold">🔵 Ваші пішаки (Сині, знизу)</span> проти <span className="text-rose-400 font-bold">🔴 Ворожих (Червоні, згори)</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="px-2.5 py-1.5 bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                            title="Правила гри"
                        >
                            <HelpCircle className="w-4 h-4 text-indigo-300" />
                            <span className="hidden sm:inline">Правила</span>
                        </button>
                        {onOpenShop && (
                            <button
                                onClick={onOpenShop}
                                className="px-2.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span className="hidden sm:inline">Магазин</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Rules Dropdown Panel */}
                {showRules && (
                    <div className="px-4 py-3 bg-stone-900/95 border-b border-indigo-500/30 text-xs text-stone-300 space-y-2">
                        <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" /> Як грати у Магічні Пішаки:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div className="p-2 bg-blue-950/40 border border-blue-500/30 rounded-lg">
                                <div className="font-bold text-blue-300 flex items-center gap-1">🔵 Рух уперед</div>
                                <p className="text-[11px] text-stone-300 mt-1">
                                    Ваші пішаки ходять на 1 клітинку ВГОРУ (⬆️) на вільне поле. Ворог ходить ВНИЗ (⬇️).
                                </p>
                            </div>
                            <div className="p-2 bg-rose-950/40 border border-rose-500/30 rounded-lg">
                                <div className="font-bold text-rose-300 flex items-center gap-1">⚔️ Атака по діагоналі</div>
                                <p className="text-[11px] text-stone-300 mt-1">
                                    Атака відкриває Чаклунський Двобій! Хто атакує — той першим обирає атакувальне закляття.
                                </p>
                            </div>
                            <div className="p-2 bg-purple-950/40 border border-purple-500/30 rounded-lg">
                                <div className="font-bold text-purple-300 flex items-center gap-1">🛡️ Захист без свитків</div>
                                <p className="text-[11px] text-stone-300 mt-1">
                                    Коли свитки захисту вичерпані: обирайте <b>Ухилення (50%)</b> або <b>Бар'єр (95%</b>, що падає на 20% з кожним попаданням).
                                </p>
                            </div>
                            <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded-lg">
                                <div className="font-bold text-amber-300 flex items-center gap-1">👑 Умова перемоги</div>
                                <p className="text-[11px] text-stone-300 mt-1">
                                    Дійдіть будь-яким пішаком до ряду 8 АБО знищіть усі 24 пішаки супротивника.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-4">

                    {/* Team Army Status Bars */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Opponent Top Banner */}
                        <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gradient-to-r from-rose-950/60 to-stone-900 border-2 border-rose-600/40 rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500 flex items-center justify-center text-xl shadow-lg shadow-rose-950">
                                        🧙🏿‍♂️
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-rose-600 text-white font-black text-[9px] rounded-full uppercase">
                                        Ворог
                                    </span>
                                </div>
                                <div>
                                    <div className="font-black text-rose-300 text-xs sm:text-sm flex items-center gap-1">
                                        <span>{opponent?.name || 'Темний Маг'}</span>
                                        <Bot className="w-3.5 h-3.5 text-rose-400" />
                                    </div>
                                    <div className="text-[11px] text-rose-300/80 flex items-center gap-1">
                                        <Flame className="w-3 h-3 text-rose-400" />
                                        <span>Живих: <b className="text-rose-200">{pawnCounts.opponent}/{requiredPawns}</b></span>
                                        <span className="text-stone-400">• Рух ⬇️</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`text-[11px] font-black px-2 py-1 rounded-lg border ${turn === 'opponent' ? 'bg-rose-600 text-white border-rose-400 animate-pulse' : 'bg-stone-900/80 text-stone-400 border-stone-700'}`}>
                                {turn === 'opponent' ? '⏳ Хід ворога' : 'Очікує'}
                            </div>
                        </div>

                        {/* Player Bottom Banner */}
                        <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gradient-to-r from-cyan-950/60 to-stone-900 border-2 border-cyan-500/40 rounded-xl">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-blue-950 border border-cyan-400 flex items-center justify-center text-xl shadow-lg shadow-cyan-950">
                                        🧙‍♂️
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-cyan-600 text-white font-black text-[9px] rounded-full uppercase">
                                        Ви
                                    </span>
                                </div>
                                <div>
                                    <div className="font-black text-cyan-200 text-xs sm:text-sm flex items-center gap-1">
                                        <span>Ваша Армія Чаклунів</span>
                                        <User className="w-3.5 h-3.5 text-cyan-400" />
                                    </div>
                                    <div className="text-[11px] text-cyan-300/80 flex items-center gap-1">
                                        <Shield className="w-3 h-3 text-cyan-400" />
                                        <span>Живих: <b className="text-cyan-100">{pawnCounts.player}/{requiredPawns}</b></span>
                                        <span className="text-stone-400">• Рух ⬆️</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`text-[11px] font-black px-2 py-1 rounded-lg border ${turn === 'player' ? 'bg-cyan-600 text-white border-cyan-300 animate-pulse' : 'bg-stone-900/80 text-stone-400 border-stone-700'}`}>
                                {turn === 'player' ? '✨ Ваш хід' : 'Очікує'}
                            </div>
                        </div>
                    </div>

                    {/* Board Area with Coordinates */}
                    <div className="flex flex-col items-center justify-center select-none">

                        {/* Top Enemy Goal Indicator */}
                        <div className="w-full max-w-[min(100%,50vh)] mb-1 px-2 py-1 bg-rose-950/50 border border-rose-600/30 rounded-t-lg flex items-center justify-between text-[10px] font-bold text-rose-300">
                            <span className="flex items-center gap-1">
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                                ЦІЛЬ ГРАВЦЯ: Дійдіть сюди для миттєвої перемоги! 🏆
                            </span>
                            <span className="text-rose-400">РЯД {boardSize} (База Ворога)</span>
                        </div>

                        {/* Top Column Labels */}
                        <div 
                            className="w-full max-w-[min(100%,50vh)] grid px-5 text-center text-[11px] font-mono font-bold text-stone-400 mb-1"
                            style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
                        >
                            {columns.map(col => (
                                <div key={`top-${col}`}>{col}</div>
                            ))}
                        </div>

                        {/* Board */}
                        <div 
                            className="relative w-full max-w-[min(100%,50vh)] aspect-square bg-stone-950 p-2.5 rounded-xl border-4 border-indigo-900/60 shadow-2xl shadow-indigo-950/50"
                        >
                            <div 
                                className="grid w-full h-full gap-1"
                                style={{
                                    gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                                    gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`
                                }}
                            >
                                {board.map((row, r) =>
                                    row.map((cell, c) => {
                                        const isDark = (r + c) % 2 === 1;
                                        const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                                        const validMove = validMoves.find(m => m.r === r && m.c === c);
                                        const isLastMoveFrom = lastMove?.from.r === r && lastMove?.from.c === c;
                                        const isLastMoveTo = lastMove?.to.r === r && lastMove?.to.c === c;

                                        // Zone backgrounds
                                        const isEnemyTerritory = r < pieceRows;
                                        const isPlayerTerritory = r >= boardSize - pieceRows;

                                        return (
                                            <button
                                                key={`${r}_${c}`}
                                                onClick={() => handleSquareClick(r, c)}
                                                className={`relative flex flex-col items-center justify-center rounded-lg transition-all duration-150 overflow-hidden group
                                                    ${isDark 
                                                        ? (isEnemyTerritory ? 'bg-rose-950/30' : isPlayerTerritory ? 'bg-blue-950/40' : 'bg-stone-900') 
                                                        : (isEnemyTerritory ? 'bg-rose-900/20' : isPlayerTerritory ? 'bg-indigo-950/30' : 'bg-stone-800/80')
                                                    }
                                                    ${isSelected ? 'ring-4 ring-amber-400 bg-amber-500/30 z-20 scale-[1.03] shadow-lg shadow-amber-500/40' : ''}
                                                    ${validMove && !validMove.isAttack ? 'ring-2 ring-emerald-400 bg-emerald-900/40 cursor-pointer hover:bg-emerald-800/50 z-10 animate-pulse' : ''}
                                                    ${validMove && validMove.isAttack ? 'ring-2 ring-rose-500 bg-rose-900/60 cursor-pointer hover:bg-rose-800/70 z-10 animate-pulse' : ''}
                                                    ${(isLastMoveFrom || isLastMoveTo) && !isSelected && !validMove ? 'ring-1 ring-yellow-400/40' : ''}
                                                    hover:brightness-110
                                                `}
                                                title={cell ? `${cell.name} (${cell.side === 'player' ? 'Ваш пішак, рухається ⬆️' : 'Ворожий пішак, рухається ⬇️'}) - ${cell.hp} HP` : `${columns[c]}${boardSize - r}`}
                                            >
                                                {/* Subtle coordinate watermark */}
                                                <span className="absolute top-0.5 left-0.5 text-[8px] font-mono text-stone-600 select-none pointer-events-none opacity-40">
                                                    {columns[c]}{boardSize - r}
                                                </span>

                                                {/* Empty tile Valid Move Indicator */}
                                                {validMove && !cell && (
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-3.5 h-3.5 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400 animate-ping opacity-75" />
                                                        <span className="text-[8px] font-black text-emerald-300 mt-1 uppercase tracking-tight">Хід</span>
                                                    </div>
                                                )}

                                                {/* Attack Overlay on Enemy Piece */}
                                                {validMove && cell && (
                                                    <div className="absolute inset-0 bg-rose-950/80 border-2 border-rose-500 rounded-lg flex flex-col items-center justify-center z-20">
                                                        <Swords className="w-5 h-5 text-amber-300 animate-bounce" />
                                                        <span className="text-[8px] font-black text-rose-200 uppercase bg-rose-900 px-1 rounded shadow">
                                                            ⚔️ Бій!
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Pawn Rendering */}
                                                {cell && (
                                                    <div className="relative w-full h-full flex flex-col items-center justify-center p-0.5 pointer-events-none">
                                                        {/* Team Token Container */}
                                                        <div className={`relative flex items-center justify-center rounded-lg w-full h-full p-0.5 border ${
                                                            cell.side === 'player'
                                                                ? 'bg-gradient-to-b from-blue-900/60 to-cyan-950/80 border-cyan-400/60 shadow-md shadow-blue-900/50'
                                                                : 'bg-gradient-to-b from-rose-950/80 to-stone-950 border-rose-500/60 shadow-md shadow-rose-950/50'
                                                        }`}>
                                                            
                                                            {/* Team Tag Pill */}
                                                            <div className={`absolute -top-1 px-1 py-0.1 rounded-sm text-[7px] font-black uppercase tracking-wider ${
                                                                cell.side === 'player'
                                                                    ? 'bg-cyan-500 text-black shadow'
                                                                    : 'bg-rose-600 text-white shadow'
                                                            }`}>
                                                                {cell.side === 'player' ? 'ВИ ⬆️' : 'ВОРОГ ⬇️'}
                                                            </div>

                                                            {/* Avatar Icon */}
                                                            <span className="text-xl sm:text-2xl drop-shadow filter transform transition-transform group-hover:scale-110 mt-1">
                                                                {cell.avatar}
                                                            </span>

                                                            {/* HP Hearts / Bar at Bottom */}
                                                            <div className="absolute bottom-0.5 left-1 right-1 flex items-center justify-center gap-0.5">
                                                                <div className={`w-full py-0.2 px-0.5 rounded text-[8px] font-black flex items-center justify-center gap-0.5 leading-none ${
                                                                    cell.side === 'player'
                                                                        ? 'bg-cyan-950/90 text-cyan-200 border border-cyan-500/40'
                                                                        : 'bg-rose-950/90 text-rose-200 border border-rose-500/40'
                                                                }`}>
                                                                    <span className="text-[7px]">❤️</span>
                                                                    <span>{cell.hp}/2</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Bottom Column Labels */}
                        <div 
                            className="w-full max-w-[min(100%,50vh)] grid px-5 text-center text-[11px] font-mono font-bold text-stone-400 mt-1"
                            style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
                        >
                            {columns.map(col => (
                                <div key={`bot-${col}`}>{col}</div>
                            ))}
                        </div>

                        {/* Bottom Player Goal Indicator */}
                        <div className="w-full max-w-[min(100%,50vh)] mt-1 px-2 py-1 bg-cyan-950/50 border border-cyan-600/30 rounded-b-lg flex items-center justify-between text-[10px] font-bold text-cyan-300">
                            <span className="flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                                ВАША ЛІНІЯ ОБОРОНИ: Не пропустіть темних магів! 🛡️
                            </span>
                            <span className="text-cyan-400">РЯД 1 (Ваша База)</span>
                        </div>
                    </div>

                    {/* Selected Pawn Detail Bar / Instruction */}
                    <div className="p-3 bg-stone-950/80 rounded-xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                        {selectedPiece && selectedPos ? (() => {
                            const linkedSoldier = selectedPiece.toySoldierId
                                ? (progress.toySoldiers || []).find(s => s.id === selectedPiece.toySoldierId)
                                : null;
                            const xp = linkedSoldier?.experience ?? 0;
                            const lvl = linkedSoldier?.level ?? 1;

                            return (
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${selectedPiece.side === 'player' ? 'bg-cyan-950 border border-cyan-400' : 'bg-rose-950 border border-rose-400'}`}>
                                        {selectedPiece.avatar}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white flex items-center gap-1.5">
                                            <span className={selectedPiece.side === 'player' ? 'text-cyan-300' : 'text-rose-400'}>
                                                {selectedPiece.name}
                                            </span>
                                            <span className="text-[10px] text-stone-400">({columns[selectedPos.c]}{boardSize - selectedPos.r})</span>
                                            {selectedPiece.side === 'player' && (
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-400 text-yellow-300 font-mono font-bold">
                                                    ⭐ {xp} XP (Рівень {lvl}★)
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-stone-300 text-[11px]">
                                            Здоров'я: <b className="text-emerald-400">{selectedPiece.hp}/2 HP</b> • Доступних ходів: <b className="text-amber-300">{validMoves.length}</b> (зелені клітинки або червоний бій)
                                        </div>
                                    </div>
                                </div>
                            );
                        })() : (
                            <div className="flex items-center gap-2 text-stone-300">
                                <div className="p-1 bg-indigo-600/30 rounded text-cyan-300">
                                    <ArrowUp className="w-4 h-4" />
                                </div>
                                <span>
                                    {turn === 'player' 
                                        ? '👉 Натисніть на будь-якого свого синього пішака (внизу), щоб побачити доступні ходи!'
                                        : '⏳ Супротивник обмірковує свій магічний хід...'}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[11px] text-cyan-300 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800">
                                🔵 Ваші (⬆️ Вгору)
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-rose-300 bg-rose-950/60 px-2 py-1 rounded border border-rose-800">
                                🔴 Ворог (⬇️ Вниз)
                            </span>
                        </div>
                    </div>

                    {/* Game Over Banner */}
                    {gameOver && (
                        <div className="p-6 bg-stone-950 border-2 border-amber-500/70 rounded-2xl text-center space-y-4 animate-scale-up shadow-2xl shadow-amber-950/50">
                            <Trophy className="w-14 h-14 text-amber-400 mx-auto animate-bounce" />
                            <h3 className="text-2xl font-black text-amber-300">
                                {gameOver === 'victory' ? '🎉 ПЕРЕМОГА У МАГІЧНИХ ПІШАКАХ!' : '💀 ПОРАЗКА'}
                            </h3>
                            <p className="text-sm text-stone-300 max-w-md mx-auto">
                                {gameOver === 'victory'
                                    ? 'Ви майстерно розгромили армію супротивника та довели свою тактичну перевагу!'
                                    : 'Супротивник виявився сильнішим. Зберіть нові сили та спробуйте знову!'}
                            </p>
                            <div className="flex justify-center gap-3 pt-2">
                                <button
                                    onClick={initBoard}
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Зіграти знову
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl transition-all"
                                >
                                    Закрити
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Battle Logs */}
                    <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl space-y-1 max-h-28 overflow-y-auto font-mono text-xs text-stone-300">
                        <div className="font-bold text-stone-400 mb-1 font-sans flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            Журнал подій битви:
                        </div>
                        {battleLogs.map((log, idx) => (
                            <div key={idx} className="leading-relaxed border-b border-stone-900/60 pb-0.5 text-stone-300">
                                {log}
                            </div>
                        ))}
                    </div>

                </div>

                {/* Nested Wizard Duel Modal Overlay when Pawn attacks Pawn */}
                {activeWizardDuel && (() => {
                    const isPlayerAttacker = activeWizardDuel.attackerPiece.side === 'player';
                    const playerPiece = isPlayerAttacker ? activeWizardDuel.attackerPiece : activeWizardDuel.defenderPiece;
                    const oppPiece = isPlayerAttacker ? activeWizardDuel.defenderPiece : activeWizardDuel.attackerPiece;

                    return (
                        <WizardBattleModal
                            isOpen={true}
                            opponent={{
                                name: oppPiece?.name || 'Темний пішак',
                                avatar: oppPiece?.avatar || '🧙🏿‍♂️'
                            }}
                            initialPlayerHp={playerPiece.hp}
                            initialOppHp={oppPiece.hp}
                            initialIsPlayerAttacking={isPlayerAttacker}
                            onVictory={(finalPlayerHp, finalOppHp) => handleWizardDuelResolution(
                                isPlayerAttacker ? 'attacker' : 'defender',
                                finalPlayerHp,
                                finalOppHp
                            )}
                            onDefeat={(finalPlayerHp, finalOppHp) => handleWizardDuelResolution(
                                isPlayerAttacker ? 'defender' : 'attacker',
                                finalPlayerHp,
                                finalOppHp
                            )}
                            onClose={() => setActiveWizardDuel(null)}
                        />
                    );
                })()}

            </div>
        </div>
    );
}


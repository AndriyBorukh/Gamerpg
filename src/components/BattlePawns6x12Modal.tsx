import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData, WorldProgress } from '../types';
import { saveWorldProgress } from '../lib/worldData';
import { 
    playGoldSound, 
    playVictorySound, 
    playDefeatSound, 
    playDiceRollSound,
    playSwordClashSound,
    playShieldBlockSound
} from '../lib/soundEffects';
import { 
    X, 
    Swords, 
    Sparkles, 
    RotateCcw, 
    Shield, 
    ShoppingBag, 
    HelpCircle, 
    Flame, 
    Clock, 
    Heart, 
    ChevronRight,
    Coins,
    Dices,
    Zap
} from 'lucide-react';
import { getFigurineRequirement, executeAutoPurchaseForActivity } from '../lib/toyAutoPurchase';

export type Pawn6x12Type = 'combat' | 'magic';
export type Pawn6x12Owner = 'player' | 'opponent';

export interface Pawn6x12Piece {
    id: string;
    type: Pawn6x12Type;
    owner: Pawn6x12Owner;
    name: string;
    avatar: string;
    experience: number;
    deaths: number;
    hp: number; // 20 max HP
    maxHp: number; // 20
    isKing?: boolean;
}

export type BoardState6x12 = (Pawn6x12Piece | null)[][];

interface BattlePawns6x12ModalProps {
    isOpen: boolean;
    opponent: OpponentData;
    tavernName?: string;
    progress: WorldProgress;
    onUpdateProgress: (newProgress: WorldProgress) => void;
    onVictory?: () => void;
    onDefeat?: () => void;
    onClose: () => void;
    onOpenToyShop?: () => void;
}

export type CoinSide = 'heads' | 'tails'; // 'heads' is successful hit (Eagle/Crown), 'tails' is miss

// Dice & Coin Duel State between two pawns
export interface PawnClashState {
    attackerPos: { r: number; c: number };
    defenderPos: { r: number; c: number };
    attackerPiece: Pawn6x12Piece;
    defenderPiece: Pawn6x12Piece;
    isPlayerAttacker: boolean;
    roundNumber: number;
    phase: 'attacker_dice' | 'attacker_coins' | 'defender_dice' | 'defender_coins' | 'resolved';
    attackerDice: number | null; // 1d10 roll (1..10)
    attackerCoins: CoinSide[] | null;
    attackerHeads: number | null;
    defenderDice: number | null; // 1d10 roll (1..10)
    defenderCoins: CoinSide[] | null;
    defenderHeads: number | null;
    damageDealt: number;
    statusMsg: string;
    isRolling: boolean;
    isFlipping: boolean;
}

const BOARD_COLS = 6;
const BOARD_ROWS = 12;
const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MAX_PAWN_HP = 20;

export function BattlePawns6x12Modal({
    isOpen,
    opponent,
    tavernName = 'Таверна',
    progress,
    onUpdateProgress,
    onVictory,
    onDefeat,
    onClose,
    onOpenToyShop
}: BattlePawns6x12ModalProps) {
    const createInitialBoard = (prog: WorldProgress) => {
        const newBoard: BoardState6x12 = Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null));

        // Opponent Row 0: 6 Magic Pawns (🔮) with 20 HP
        for (let c = 0; c < BOARD_COLS; c++) {
            newBoard[0][c] = {
                id: `opp_magic_${c}`,
                type: 'magic',
                owner: 'opponent',
                name: `Темний Магічний Пішак ${COL_LABELS[c]}`,
                avatar: '🔮',
                experience: 0,
                deaths: 0,
                hp: MAX_PAWN_HP,
                maxHp: MAX_PAWN_HP
            };
        }

        // Opponent Row 1: 6 Combat Pawns (⚔️) with 20 HP
        for (let c = 0; c < BOARD_COLS; c++) {
            newBoard[1][c] = {
                id: `opp_combat_${c}`,
                type: 'combat',
                owner: 'opponent',
                name: `Темний Бойовий Пішак ${COL_LABELS[c]}`,
                avatar: '⚔️',
                experience: 0,
                deaths: 0,
                hp: MAX_PAWN_HP,
                maxHp: MAX_PAWN_HP
            };
        }

        // Player owned pieces from inventory (only non-worn pieces with deaths < 3)
        const ownedCombat = (prog.toySoldiers || []).filter(
            s => (s.type === 'пішак' || s.type === 'піхотинець' || !s.type?.includes('маг')) && (s.deaths || 0) < 3
        );
        const ownedMagic = (prog.toySoldiers || []).filter(
            s => (s.type === 'магічний_пішак' || s.type?.includes('маг')) && (s.deaths || 0) < 3
        );

        // Player Row 10: 6 Combat Pawns (⚔️) with 20 HP
        for (let c = 0; c < BOARD_COLS; c++) {
            const soldier = ownedCombat[c];
            newBoard[10][c] = {
                id: soldier ? soldier.id : `player_combat_${c}`,
                type: 'combat',
                owner: 'player',
                name: soldier ? soldier.name : `Бойовий Пішак ${COL_LABELS[c]}`,
                avatar: soldier?.avatar || '⚔️',
                experience: soldier?.experience || 0,
                deaths: soldier?.deaths || 0,
                hp: MAX_PAWN_HP,
                maxHp: MAX_PAWN_HP
            };
        }

        // Player Row 11: 6 Magic Pawns (🔮) with 20 HP
        for (let c = 0; c < BOARD_COLS; c++) {
            const soldier = ownedMagic[c];
            newBoard[11][c] = {
                id: soldier ? soldier.id : `player_magic_${c}`,
                type: 'magic',
                owner: 'player',
                name: soldier ? soldier.name : `Магічний Пішак ${COL_LABELS[c]}`,
                avatar: soldier?.avatar || '🔮',
                experience: soldier?.experience || 0,
                deaths: soldier?.deaths || 0,
                hp: MAX_PAWN_HP,
                maxHp: MAX_PAWN_HP
            };
        }

        return newBoard;
    };

    const [board, setBoard] = useState<BoardState6x12>(() => createInitialBoard(progress));
    const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
    const [validMoves, setValidMoves] = useState<{ r: number; c: number; isAttack: boolean }[]>([]);
    const [lastMove, setLastMove] = useState<{ from: { r: number; c: number }; to: { r: number; c: number } } | null>(null);
    const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent'>('player');
    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | null>(null);
    const [showRules, setShowRules] = useState(false);
    const [battleLogs, setBattleLogs] = useState<string[]>([]);
    const [isBotThinking, setIsBotThinking] = useState(false);

    // Active 1d10 + Coin Toss Duel between two pawns
    const [clashState, setClashState] = useState<PawnClashState | null>(null);

    const initBoard = () => {
        const newBoard = createInitialBoard(progress);
        setBoard(newBoard);
        setSelectedPos(null);
        setValidMoves([]);
        setLastMove(null);
        setCurrentTurn('player');
        setGameResult(null);
        setClashState(null);
        setBattleLogs([
            '⚔️ Початок гри «Битва Пішаків 6х12: Мечі та Магія»!',
            'У кожного пішака по 20 HP. Бійці б\'ють по діагоналі на 1 клітинку, маги — через одну клітинку.',
            'При атаці: Атакуючий кидає 1d10 і стільки монет, потім Захисник кидає 1d10 і стільки монет. Різниця монет наносить шкоду!'
        ]);
    };

    const checkPromotion = (currentBoard: BoardState6x12) => {
        const nextBoard = currentBoard.map(row => [...row]);
        let promotedAny = false;
        // Check player pieces on row 0
        for (let c = 0; c < BOARD_COLS; c++) {
            const piece = nextBoard[0][c];
            if (piece && piece.owner === 'player' && !piece.isKing) {
                piece.isKing = true;
                piece.name = `Король ${piece.name.replace('Пішак', '')}`;
                piece.avatar = '👑';
                promotedAny = true;
                setBattleLogs(prev => [
                    `👑 ВЕЛИКА ПОДІЯ: Ваш ${piece.name} досяг першого ряду і став КОРОЛЕМ!`,
                    ...prev.slice(0, 15)
                ]);
            }
        }
        // Check opponent pieces on row 11
        for (let c = 0; c < BOARD_COLS; c++) {
            const piece = nextBoard[BOARD_ROWS - 1][c];
            if (piece && piece.owner === 'opponent' && !piece.isKing) {
                piece.isKing = true;
                piece.name = `Король ${piece.name.replace('Пішак', '')}`;
                piece.avatar = '👑';
                promotedAny = true;
                setBattleLogs(prev => [
                    `👑 ТРИВОГА: Ворожий ${piece.name} досяг вашого ряду і став КОРОЛЕМ!`,
                    ...prev.slice(0, 15)
                ]);
            }
        }
        return { nextBoard, promotedAny };
    };

    const checkGameEnd = (currentBoard: BoardState6x12, activeTurn: 'player' | 'opponent') => {
        let playerCount = 0;
        let oppCount = 0;
        let playerHasMoves = false;
        let oppHasMoves = false;

        for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c < BOARD_COLS; c++) {
                const p = currentBoard[r][c];
                if (p) {
                    if (p.owner === 'player') {
                        playerCount++;
                        if (getValidMovesForPiece(r, c, currentBoard).length > 0) {
                            playerHasMoves = true;
                        }
                    } else {
                        oppCount++;
                        if (getValidMovesForPiece(r, c, currentBoard).length > 0) {
                            oppHasMoves = true;
                        }
                    }
                }
            }
        }

        if (oppCount === 0) {
            handlePlayerVictory('Усі сили супротивника знищено!');
            return true;
        }
        if (playerCount === 0) {
            handlePlayerDefeat('Усі ваші сили було знищено!');
            return true;
        }

        if (activeTurn === 'player' && !playerHasMoves) {
            handlePlayerDefeat('ПАТ! У вас немає можливих ходів. Ви програли за правилами пату!');
            return true;
        }
        if (activeTurn === 'opponent' && !oppHasMoves) {
            handlePlayerVictory('ПАТ! У супротивника немає можливих ходів. Ви перемогли за правилами пату!');
            return true;
        }

        return false;
    };

    // Calculate valid moves for a piece at (r, c)
    const getValidMovesForPiece = (r: number, c: number, currentBoard: BoardState6x12) => {
        const piece = currentBoard[r][c];
        if (!piece) return [];
        const moves: { r: number; c: number; isAttack: boolean }[] = [];
        const isPlayer = piece.owner === 'player';
        const dir = isPlayer ? -1 : 1; // Player moves UP (-1), opponent moves DOWN (+1)

        // 1. King movement/attacks: 1 step in any of 8 directions
        if (piece.isKing) {
            const kingDeltas = [
                { dr: -1, dc: 0 },
                { dr: 1, dc: 0 },
                { dr: 0, dc: -1 },
                { dr: 0, dc: 1 },
                { dr: -1, dc: -1 },
                { dr: -1, dc: 1 },
                { dr: 1, dc: -1 },
                { dr: 1, dc: 1 }
            ];
            for (const delta of kingDeltas) {
                const tr = r + delta.dr;
                const tc = c + delta.dc;
                if (tr >= 0 && tr < BOARD_ROWS && tc >= 0 && tc < BOARD_COLS) {
                    const target = currentBoard[tr][tc];
                    if (!target) {
                        moves.push({ r: tr, c: tc, isAttack: false });
                    } else if (target.owner !== piece.owner) {
                        moves.push({ r: tr, c: tc, isAttack: true });
                    }
                }
            }
            return moves;
        }

        // 2. Standard Pawn movement: (1 step forward to empty cell)
        const forwardR = r + dir;
        if (forwardR >= 0 && forwardR < BOARD_ROWS && !currentBoard[forwardR][c]) {
            moves.push({ r: forwardR, c, isAttack: false });

            // Optional 2-step first move if from starting rows (10 or 11 for player, 1 or 0 for bot)
            const isStartingRow = isPlayer ? (r === 10 || r === 11) : (r === 0 || r === 1);
            const doubleR = r + dir * 2;
            if (isStartingRow && doubleR >= 0 && doubleR < BOARD_ROWS && !currentBoard[doubleR][c]) {
                moves.push({ r: doubleR, c, isAttack: false });
            }
        }

        // 3. Attacks:
        if (piece.type === 'combat') {
            // Combat pawns strike 1 square diagonally
            const attackDeltas = [
                { dr: dir, dc: -1 },
                { dr: dir, dc: 1 }
            ];
            for (const delta of attackDeltas) {
                const tr = r + delta.dr;
                const tc = c + delta.dc;
                if (tr >= 0 && tr < BOARD_ROWS && tc >= 0 && tc < BOARD_COLS) {
                    const target = currentBoard[tr][tc];
                    if (target && target.owner !== piece.owner) {
                        moves.push({ r: tr, c: tc, isAttack: true });
                    }
                }
            }
        } else if (piece.type === 'magic') {
            // Magic pawns strike across 1 cell (range 2)
            const magicDeltas = [
                { dr: dir * 2, dc: 0 },
                { dr: dir * 2, dc: -2 },
                { dr: dir * 2, dc: 2 },
                { dr: dir * 2, dc: -1 },
                { dr: dir * 2, dc: 1 },
                { dr: 0, dc: -2 },
                { dr: 0, dc: 2 }
            ];
            for (const delta of magicDeltas) {
                const tr = r + delta.dr;
                const tc = c + delta.dc;
                if (tr >= 0 && tr < BOARD_ROWS && tc >= 0 && tc < BOARD_COLS) {
                    const target = currentBoard[tr][tc];
                    if (target && target.owner !== piece.owner) {
                        moves.push({ r: tr, c: tc, isAttack: true });
                    }
                }
            }
        }

        return moves;
    };

    // Handle square click on 6x12 board
    const handleSquareClick = (r: number, c: number) => {
        if (currentTurn !== 'player' || clashState || gameResult || isBotThinking) return;

        const piece = board[r][c];

        // 1. If clicking own piece: select it and display valid moves
        if (piece && piece.owner === 'player') {
            setSelectedPos({ r, c });
            setValidMoves(getValidMovesForPiece(r, c, board));
            return;
        }

        // 2. If already selected a piece and clicked on a valid destination
        if (selectedPos) {
            const move = validMoves.find(m => m.r === r && m.c === c);
            if (move) {
                executePlayerMove(selectedPos, { r, c }, move.isAttack);
                setSelectedPos(null);
                setValidMoves([]);
                return;
            }
        }

        // Deselect
        setSelectedPos(null);
        setValidMoves([]);
    };

    // Execute player peaceful move or trigger attack duel
    const executePlayerMove = (
        from: { r: number; c: number }, 
        to: { r: number; c: number }, 
        isAttack: boolean
    ) => {
        const attackerPiece = board[from.r][from.c];
        if (!attackerPiece) return;

        if (isAttack) {
            const defenderPiece = board[to.r][to.c];
            if (!defenderPiece) return;
            // Launch 1d10 + Coin Toss Duel!
            startPawnDiceCoinClash(from, to, attackerPiece, defenderPiece, true);
        } else {
            // Peaceful move forward
            let newBoard = board.map(row => [...row]);
            newBoard[to.r][to.c] = attackerPiece;
            newBoard[from.r][from.c] = null;

            // Apply promotion check
            const promo = checkPromotion(newBoard);
            newBoard = promo.nextBoard;

            setBoard(newBoard);
            setLastMove({ from, to });
            setBattleLogs(prev => [
                `♟️ ${attackerPiece.name} (${attackerPiece.hp}/20 HP) перемістився на ${COL_LABELS[to.c]}${BOARD_ROWS - to.r}.`,
                ...prev.slice(0, 15)
            ]);

            // Check overall victory or defeat
            const ended = checkGameEnd(newBoard, 'opponent');
            if (!ended) {
                // Pass turn to Bot
                setCurrentTurn('opponent');
            }
        }
    };

    // -------------------------------------------------------------
    // 1d10 + COIN TOSS DUEL MECHANICS
    // -------------------------------------------------------------
    const startPawnDiceCoinClash = (
        attackerPos: { r: number; c: number },
        defenderPos: { r: number; c: number },
        attackerPiece: Pawn6x12Piece,
        defenderPiece: Pawn6x12Piece,
        isPlayerAttacker: boolean,
        roundNumber: number = 1
    ) => {
        const initialClash: PawnClashState = {
            attackerPos,
            defenderPos,
            attackerPiece,
            defenderPiece,
            isPlayerAttacker,
            roundNumber,
            phase: 'attacker_dice',
            attackerDice: null,
            attackerCoins: null,
            attackerHeads: null,
            defenderDice: null,
            defenderCoins: null,
            defenderHeads: null,
            damageDealt: 0,
            statusMsg: isPlayerAttacker
                ? `🎲 Киньте 1d10, щоб визначити кількість монет атаки!`
                : `🤖 ${attackerPiece.name} кидає 1d10 для атаки...`,
            isRolling: false,
            isFlipping: false
        };

        playDiceRollSound();
        setClashState(initialClash);
        setBattleLogs(prev => [
            `⚔️ СУТИЧКА: ${attackerPiece.name} (${attackerPiece.hp}/20 HP) атакує ${defenderPiece.name} (${defenderPiece.hp}/20 HP)!`,
            ...prev.slice(0, 15)
        ]);

        // If bot is attacker, trigger bot dice roll
        if (!isPlayerAttacker) {
            setTimeout(() => botExecuteAttackerDice(initialClash), 700);
        }
    };

    // 1. Attacker rolls 1d10
    const handleAttackerRollDice = () => {
        if (!clashState || clashState.phase !== 'attacker_dice' || !clashState.isPlayerAttacker) return;
        executeAttackerDiceRoll(clashState);
    };

    const executeAttackerDiceRoll = (state: PawnClashState) => {
        playDiceRollSound();
        setClashState(prev => prev ? { ...prev, isRolling: true } : null);

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 10) + 1; // 1..10
            const updated: PawnClashState = {
                ...state,
                isRolling: false,
                attackerDice: roll,
                phase: 'attacker_coins',
                statusMsg: `🎲 Результат 1d10: [${roll}]. Тепер підкиньте ${roll} ${roll === 1 ? 'монету' : roll < 5 ? 'монети' : 'монет'} атаки!`
            };
            setClashState(updated);

            if (!state.isPlayerAttacker) {
                setTimeout(() => botExecuteAttackerCoins(updated), 700);
            }
        }, 600);
    };

    const botExecuteAttackerDice = (state: PawnClashState) => {
        executeAttackerDiceRoll(state);
    };

    // 2. Attacker flips coins
    const handleAttackerFlipCoins = () => {
        if (!clashState || clashState.phase !== 'attacker_coins' || !clashState.isPlayerAttacker || !clashState.attackerDice) return;
        executeAttackerCoinsFlip(clashState);
    };

    const executeAttackerCoinsFlip = (state: PawnClashState) => {
        if (!state.attackerDice) return;
        playGoldSound();
        setClashState(prev => prev ? { ...prev, isFlipping: true } : null);

        setTimeout(() => {
            const count = state.attackerDice || 1;
            const coins: CoinSide[] = [];
            let heads = 0;
            for (let i = 0; i < count; i++) {
                const side: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails';
                coins.push(side);
                if (side === 'heads') heads++;
            }

            const updated: PawnClashState = {
                ...state,
                isFlipping: false,
                attackerCoins: coins,
                attackerHeads: heads,
                phase: 'defender_dice',
                statusMsg: `🪙 Атакуючий викинув ${heads} ${heads === 1 ? 'орла' : 'орлів'}! Черга захисника кидати 1d10.`
            };
            setClashState(updated);

            // If player is defender, wait for player click; if bot is defender, trigger bot roll
            if (state.isPlayerAttacker) {
                // Bot is defender
                setTimeout(() => botExecuteDefenderDice(updated), 700);
            }
        }, 650);
    };

    const botExecuteAttackerCoins = (state: PawnClashState) => {
        executeAttackerCoinsFlip(state);
    };

    // 3. Defender rolls 1d10
    const handleDefenderRollDice = () => {
        if (!clashState || clashState.phase !== 'defender_dice' || clashState.isPlayerAttacker) return;
        executeDefenderDiceRoll(clashState);
    };

    const executeDefenderDiceRoll = (state: PawnClashState) => {
        playDiceRollSound();
        setClashState(prev => prev ? { ...prev, isRolling: true } : null);

        setTimeout(() => {
            const roll = Math.floor(Math.random() * 10) + 1; // 1..10
            const updated: PawnClashState = {
                ...state,
                isRolling: false,
                defenderDice: roll,
                phase: 'defender_coins',
                statusMsg: `🎲 Захисник викинув [${roll}] на 1d10! Підкидаємо ${roll} ${roll === 1 ? 'монету' : roll < 5 ? 'монети' : 'монет'} захисту...`
            };
            setClashState(updated);

            if (state.isPlayerAttacker) {
                // Bot is defender
                setTimeout(() => botExecuteDefenderCoins(updated), 700);
            }
        }, 600);
    };

    const botExecuteDefenderDice = (state: PawnClashState) => {
        executeDefenderDiceRoll(state);
    };

    // 4. Defender flips coins & Resolves Clash Damage
    const handleDefenderFlipCoins = () => {
        if (!clashState || clashState.phase !== 'defender_coins' || clashState.isPlayerAttacker || !clashState.defenderDice) return;
        executeDefenderCoinsFlip(clashState);
    };

    const executeDefenderCoinsFlip = (state: PawnClashState) => {
        if (!state.defenderDice) return;
        playGoldSound();
        setClashState(prev => prev ? { ...prev, isFlipping: true } : null);

        setTimeout(() => {
            const count = state.defenderDice || 1;
            const coins: CoinSide[] = [];
            let heads = 0;
            for (let i = 0; i < count; i++) {
                const side: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails';
                coins.push(side);
                if (side === 'heads') heads++;
            }

            const attHeads = state.attackerHeads ?? 0;
            const defHeads = heads;
            const rawDiff = attHeads - defHeads;
            const damage = rawDiff > 0 ? rawDiff : 0;
            const newDefenderHp = Math.max(0, state.defenderPiece.hp - damage);

            if (damage > 0) {
                playSwordClashSound();
            } else {
                playShieldBlockSound();
            }

            const updatedDefenderPiece: Pawn6x12Piece = {
                ...state.defenderPiece,
                hp: newDefenderHp
            };

            const outcomeMsg = damage > 0
                ? `💥 Удар пройшов! Атака (${attHeads} 👑) перевищила Захист (${defHeads} 🛡️). Нанесено ${damage} шкоди!`
                : `🛡️ Удар відбито! Захист (${defHeads} 🛡️) зупинив Атаку (${attHeads} 👑). 0 шкоди!`;

            const updated: PawnClashState = {
                ...state,
                isFlipping: false,
                defenderCoins: coins,
                defenderHeads: heads,
                damageDealt: damage,
                defenderPiece: updatedDefenderPiece,
                phase: 'resolved',
                statusMsg: newDefenderHp <= 0
                    ? `💀 ${updatedDefenderPiece.name} отримав смертельний удар (HP: 0/20) та був знищений!`
                    : outcomeMsg
            };
            setClashState(updated);

            // Log entry
            setBattleLogs(prev => [
                `⚔️ Раунд ${state.roundNumber}: Атака (${attHeads} орлів) vs Захист (${defHeads} орлів) ➔ Шкода: ${damage}. У ${updatedDefenderPiece.name} залишилося ${newDefenderHp}/20 HP.`,
                ...prev.slice(0, 15)
            ]);
        }, 650);
    };

    const botExecuteDefenderCoins = (state: PawnClashState) => {
        executeDefenderCoinsFlip(state);
    };

    // Finish entire clash (when defender dies or player/bot concludes turn)
    const handleFinishClash = () => {
        if (!clashState) return;
        const { attackerPos, defenderPos, attackerPiece, defenderPiece, isPlayerAttacker } = clashState;

        let newBoard = board.map(row => [...row]);

        if (defenderPiece.hp <= 0) {
            // Defender was killed!
            if (isPlayerAttacker) {
                playVictorySound();
                setBattleLogs(prev => [
                    `🏆 ПЕРЕМОГА У СУТИЧЦІ! Ваш ${attackerPiece.name} повністю знищив ${defenderPiece.name}!`,
                    ...prev.slice(0, 15)
                ]);

                if (attackerPiece.type === 'combat' || attackerPiece.isKing) {
                    newBoard[defenderPos.r][defenderPos.c] = attackerPiece;
                    newBoard[attackerPos.r][attackerPos.c] = null;
                } else {
                    newBoard[defenderPos.r][defenderPos.c] = null;
                }

                // Reward player
                const updatedProg: WorldProgress = {
                    ...progress,
                    playerGold: progress.playerGold + 15,
                    cardPieces: (progress.cardPieces || 0) + 2
                };
                onUpdateProgress(updatedProg);
                saveWorldProgress(updatedProg);

            } else {
                playDefeatSound();
                setBattleLogs(prev => [
                    `💀 ПОРАЗКА У СУТИЧЦІ: Ваш ${defenderPiece.name} був знищений ворожим ${attackerPiece.name}!`,
                    ...prev.slice(0, 15)
                ]);

                if (attackerPiece.type === 'combat' || attackerPiece.isKing) {
                    newBoard[defenderPos.r][defenderPos.c] = attackerPiece;
                    newBoard[attackerPos.r][attackerPos.c] = null;
                } else {
                    newBoard[defenderPos.r][defenderPos.c] = null;
                }

                // If player owned piece, increment deaths count
                if (defenderPiece.id) {
                    const updatedSoldiers = (progress.toySoldiers || []).map(s => {
                        if (s.id === defenderPiece.id) {
                            const newDeaths = (s.deaths || 0) + 1;
                            return { ...s, deaths: newDeaths };
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
            }
        } else {
            // Defender survived with reduced HP
            newBoard[defenderPos.r][defenderPos.c] = defenderPiece;
            setBattleLogs(prev => [
                `🛡️ Сутичку завершено: ${defenderPiece.name} вистояв із ${defenderPiece.hp}/20 HP!`,
                ...prev.slice(0, 15)
            ]);
        }

        // Apply promotion check
        const promo = checkPromotion(newBoard);
        newBoard = promo.nextBoard;

        setBoard(newBoard);
        setClashState(null);

        // Check overall victory or defeat
        const nextTurn = isPlayerAttacker ? 'opponent' : 'player';
        const ended = checkGameEnd(newBoard, nextTurn);
        if (!ended) {
            // Switch turn to other side on main board
            setCurrentTurn(nextTurn);
        }
    };

    // Quick full auto resolution for this clash round
    const handleQuickAutoRound = () => {
        if (!clashState || clashState.phase === 'resolved') return;

        const attRoll = clashState.attackerDice || (Math.floor(Math.random() * 10) + 1);
        let attHeads = 0;
        const attCoins: CoinSide[] = [];
        for (let i = 0; i < attRoll; i++) {
            const side: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails';
            attCoins.push(side);
            if (side === 'heads') attHeads++;
        }

        const defRoll = Math.floor(Math.random() * 10) + 1;
        let defHeads = 0;
        const defCoins: CoinSide[] = [];
        for (let i = 0; i < defRoll; i++) {
            const side: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails';
            defCoins.push(side);
            if (side === 'heads') defHeads++;
        }

        const rawDiff = attHeads - defHeads;
        const damage = rawDiff > 0 ? rawDiff : 0;
        const newHp = Math.max(0, clashState.defenderPiece.hp - damage);

        if (damage > 0) playSwordClashSound();
        else playShieldBlockSound();

        const updatedDef: Pawn6x12Piece = {
            ...clashState.defenderPiece,
            hp: newHp
        };

        const updated: PawnClashState = {
            ...clashState,
            attackerDice: attRoll,
            attackerCoins: attCoins,
            attackerHeads: attHeads,
            defenderDice: defRoll,
            defenderCoins: defCoins,
            defenderHeads: defHeads,
            damageDealt: damage,
            defenderPiece: updatedDef,
            phase: 'resolved',
            statusMsg: newHp <= 0 
                ? `💀 ${updatedDef.name} знищено (0/20 HP)!`
                : (damage > 0 ? `💥 Нанесено ${damage} шкоди! (${attHeads} 👑 vs ${defHeads} 🛡️)` : `🛡️ 0 шкоди, атаку заблоковано!`)
        };
        setClashState(updated);
    };

    // Handle Bot AI Turn on 6x12 Board
    useEffect(() => {
        if (currentTurn !== 'opponent' || clashState || gameResult) return;

        setIsBotThinking(true);
        const timer = setTimeout(() => {
            makeBotMove();
            setIsBotThinking(false);
        }, 650);

        return () => clearTimeout(timer);
    }, [currentTurn, clashState, gameResult, board]);

    const makeBotMove = () => {
        // Collect all bot pieces and their valid moves
        const botPiecesWithMoves: { 
            from: { r: number; c: number }; 
            piece: Pawn6x12Piece; 
            moves: { r: number; c: number; isAttack: boolean }[] 
        }[] = [];

        for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c < BOARD_COLS; c++) {
                const piece = board[r][c];
                if (piece && piece.owner === 'opponent') {
                    const moves = getValidMovesForPiece(r, c, board);
                    if (moves.length > 0) {
                        botPiecesWithMoves.push({ from: { r, c }, piece, moves });
                    }
                }
            }
        }

        if (botPiecesWithMoves.length === 0) {
            handlePlayerVictory('У супротивника не залишилося можливих ходів!');
            return;
        }

        // AI Priority 1: Attacks!
        const attackCandidates: { 
            from: { r: number; c: number }; 
            to: { r: number; c: number }; 
            piece: Pawn6x12Piece 
        }[] = [];

        for (const item of botPiecesWithMoves) {
            for (const m of item.moves) {
                if (m.isAttack) {
                    attackCandidates.push({ from: item.from, to: { r: m.r, c: m.c }, piece: item.piece });
                }
            }
        }

        if (attackCandidates.length > 0) {
            const chosen = attackCandidates[Math.floor(Math.random() * attackCandidates.length)];
            const targetPiece = board[chosen.to.r][chosen.to.c];
            if (targetPiece) {
                startPawnDiceCoinClash(chosen.from, chosen.to, chosen.piece, targetPiece, false);
                return;
            }
        }

        // AI Priority 2: Forward advancement towards row 11
        const forwardMoves: { 
            from: { r: number; c: number }; 
            to: { r: number; c: number }; 
            piece: Pawn6x12Piece 
        }[] = [];

        for (const item of botPiecesWithMoves) {
            for (const m of item.moves) {
                if (!m.isAttack) {
                    forwardMoves.push({ from: item.from, to: { r: m.r, c: m.c }, piece: item.piece });
                }
            }
        }

        if (forwardMoves.length > 0) {
            forwardMoves.sort((a, b) => b.to.r - a.to.r);
            const chosen = forwardMoves[0];

            let newBoard = board.map(row => [...row]);
            newBoard[chosen.to.r][chosen.to.c] = chosen.piece;
            newBoard[chosen.from.r][chosen.from.c] = null;

            // Apply promotion check
            const promo = checkPromotion(newBoard);
            newBoard = promo.nextBoard;

            setBoard(newBoard);
            setLastMove({ from: chosen.from, to: chosen.to });
            setBattleLogs(prev => [
                `🤖 ${chosen.piece.name} перемістився на ${COL_LABELS[chosen.to.c]}${BOARD_ROWS - chosen.to.r}.`,
                ...prev.slice(0, 15)
            ]);

            // Check overall victory or defeat
            const ended = checkGameEnd(newBoard, 'player');
            if (!ended) {
                setCurrentTurn('player');
            }
        }
    };

    const handlePlayerVictory = (reason: string) => {
        setGameResult('victory');
        playVictorySound();
        const updatedProg: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold + 60,
            cardPieces: (progress.cardPieces || 0) + 10,
            shopRefreshTokens: (progress.shopRefreshTokens || 0) + 1
        };
        onUpdateProgress(updatedProg);
        saveWorldProgress(updatedProg);
        onVictory?.();
    };

    const handlePlayerDefeat = (reason: string) => {
        setGameResult('defeat');
        playDefeatSound();
        onDefeat?.();
    };

    if (!isOpen) return null;

    // Check if player has enough ready pieces (6 combat pawns and 6 magic pawns with deaths < 3)
    // We initialize this check at component mount (as state) so that if pawns die during the match, the board is not dynamically unmounted!
    const [hasEnoughPawnsOnStart, setHasEnoughPawnsOnStart] = useState(() => {
        const ownedCombatOnStart = (progress.toySoldiers || []).filter(
            s => (s.type === 'пішак' || s.type === 'піхотинець' || !s.type?.includes('маг')) && (s.deaths || 0) < 3
        );
        const ownedMagicOnStart = (progress.toySoldiers || []).filter(
            s => (s.type === 'магічний_пішак' || s.type?.includes('маг')) && (s.deaths || 0) < 3
        );
        return ownedCombatOnStart.length >= 6 && ownedMagicOnStart.length >= 6;
    });

    const ownedCombatCountCurrent = (progress.toySoldiers || []).filter(
        s => (s.type === 'пішак' || s.type === 'піхотинець' || !s.type?.includes('маг')) && (s.deaths || 0) < 3
    ).length;

    const ownedMagicCountCurrent = (progress.toySoldiers || []).filter(
        s => (s.type === 'магічний_пішак' || s.type?.includes('маг')) && (s.deaths || 0) < 3
    ).length;

    if (!hasEnoughPawnsOnStart) {
        const reqInfo = getFigurineRequirement('battle_pawns_6x12', progress);
        const missingCost = reqInfo?.missingCost || 0;
        const canAfford = (progress.playerGold || 0) >= missingCost;

        const handleAutoBuyPawns6x12 = () => {
            const res = executeAutoPurchaseForActivity('battle_pawns_6x12', progress);
            if (res.success && res.updatedProgress) {
                onUpdateProgress(res.updatedProgress);
                saveWorldProgress(res.updatedProgress);
                setHasEnoughPawnsOnStart(true);
            }
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg p-6 rounded-3xl bg-[#180f0a] border-2 border-red-500/60 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-[#f5ebd7] text-center space-y-4"
                >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950/80 border-2 border-red-500/50 flex items-center justify-center text-3xl shadow-inner">
                        ⚠️
                    </div>

                    <div>
                        <h3 className="font-serif font-black text-xl text-amber-300">
                            Недостатньо фігурок для гри!
                        </h3>
                        <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                            Для участі в <strong className="text-amber-200">«Битві Пішаків 6х12»</strong> необхідно мати у своїй колекції мінімум <strong>6 бойових</strong> та <strong>6 магічних пішаків</strong> (не зношених, &lt; 3/3 поразок).
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-black/40 rounded-2xl border border-stone-800 text-xs">
                        <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
                            ownedCombatCountCurrent >= 6 
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        }`}>
                            <span className="text-xl">⚔️</span>
                            <span className="font-bold">Бойові пішаки</span>
                            <span className="font-black text-sm">{ownedCombatCountCurrent} / 6</span>
                        </div>

                        <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
                            ownedMagicCountCurrent >= 6 
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                        }`}>
                            <span className="text-xl">🔮</span>
                            <span className="font-bold">Магічні пішаки</span>
                            <span className="font-black text-sm">{ownedMagicCountCurrent} / 6</span>
                        </div>
                    </div>

                    <p className="text-[11px] text-amber-400/90 italic">
                        *Зношені фігурки (3/3) не можуть брати участь у битві. Скористайтеся автопокупкою або придбайте їх у магазині!
                    </p>

                    <div className="flex flex-col gap-2 pt-2">
                        {canAfford ? (
                            <button
                                onClick={handleAutoBuyPawns6x12}
                                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition hover:scale-[1.02]"
                            >
                                <Zap className="w-4 h-4 fill-current" />
                                <span>⚡ Автопокупка всіх необхідних пішаків ({missingCost} 🪙)</span>
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

    // Count alive pieces
    let playerCount = 0;
    let botCount = 0;
    let playerCombat = 0;
    let playerMagic = 0;
    let botCombat = 0;
    let botMagic = 0;

    for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
            const p = board[r][c];
            if (p) {
                if (p.owner === 'player') {
                    playerCount++;
                    if (p.type === 'combat') playerCombat++;
                    else playerMagic++;
                } else {
                    botCount++;
                    if (p.type === 'combat') botCombat++;
                    else botMagic++;
                }
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-5xl max-h-[96vh] flex flex-col rounded-3xl bg-[#140e0a] border-2 border-[#b8860b]/70 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden text-[#f5ebd7]"
            >
                {/* Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-[#2a1a10] via-[#1c120c] to-[#2a1a10] border-b-2 border-[#b8860b]/60 flex items-center justify-between shadow-xl shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl sm:text-3xl p-2 rounded-2xl bg-amber-950/80 border border-amber-500/60 shadow-inner">
                            ⚔️🔮
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-serif font-black text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400">
                                    Битва Пішаків 6х12: Мечі та Магія
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-950/90 border border-amber-500/60 text-amber-300 uppercase flex items-center gap-1">
                                    <Dices className="w-3 h-3" />
                                    <span>1d10 + Монети (20 HP)</span>
                                </span>
                            </div>
                            <p className="text-xs text-[#a89988]">
                                {tavernName} • Суперник: <strong className="text-amber-200">{opponent.name}</strong> ({opponent.title})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="p-2 text-amber-300 hover:text-white bg-[#2e1d12] hover:bg-[#3d2718] border border-amber-500/40 rounded-xl transition-all"
                            title="Правила гри"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={initBoard}
                            className="p-2 text-amber-300 hover:text-white bg-[#2e1d12] hover:bg-[#3d2718] border border-amber-500/40 rounded-xl transition-all"
                            title="Почати заново"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        {onOpenToyShop && (
                            <button
                                onClick={onOpenToyShop}
                                className="px-3 py-1.5 text-xs font-bold text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/50 rounded-xl transition-all flex items-center gap-1.5"
                                title="Магазин іграшок"
                            >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Магазин</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Score & Turn Info Bar */}
                <div className="px-4 py-2 bg-[#1b120c] border-b border-[#b8860b]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                        {/* Player pieces count */}
                        <div className="flex items-center gap-1.5 bg-[#261810] px-3 py-1 rounded-xl border border-amber-500/40">
                            <span className="font-bold text-amber-300">Ваші сили:</span>
                            <span className="font-black text-white">{playerCount} / 12</span>
                            <span className="text-[10px] text-amber-400">({playerCombat}⚔️ • {playerMagic}🔮)</span>
                        </div>

                        {/* Bot pieces count */}
                        <div className="flex items-center gap-1.5 bg-[#261810] px-3 py-1 rounded-xl border border-purple-500/40">
                            <span className="font-bold text-purple-300">{opponent.name}:</span>
                            <span className="font-black text-white">{botCount} / 12</span>
                            <span className="text-[10px] text-purple-400">({botCombat}⚔️ • {botMagic}🔮)</span>
                        </div>
                    </div>

                    {/* Turn Indicator */}
                    <div className="flex items-center gap-2">
                        {currentTurn === 'player' ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                                <span>🟢</span> Ваш хід! (Оберіть пішака для руху або атаки)
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/60 text-purple-300 font-bold text-xs flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 animate-spin" /> Хід супротивника...
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Body */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Chessboard Area (6x12) */}
                    <div className="flex-1 p-2 sm:p-4 flex items-center justify-center overflow-y-auto">
                        <div className="relative bg-[#2e1d10] p-3 sm:p-4 rounded-2xl border-4 border-[#8c5a28] shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                            {/* Column Letters Top */}
                            <div className="flex justify-around mb-1 text-[10px] font-bold text-amber-400 font-mono">
                                {COL_LABELS.map(col => (
                                    <span key={`col-top-${col}`} className="w-8 sm:w-10 text-center">{col}</span>
                                ))}
                            </div>

                            {/* Board Grid: 12 rows x 6 cols */}
                            <div className="grid grid-rows-12 gap-0 border-2 border-[#5c3a1a] shadow-inner bg-[#140c06]">
                                {board.map((row, r) => (
                                    <div key={`row-${r}`} className="flex items-center">
                                        {/* Rank Label Left */}
                                        <span className="absolute -left-3 text-[9px] font-bold text-amber-500/80 font-mono">
                                            {BOARD_ROWS - r}
                                        </span>

                                        {row.map((cell, c) => {
                                            const isDark = (r + c) % 2 === 1;
                                            const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                                            const moveInfo = validMoves.find(m => m.r === r && m.c === c);
                                            const isLastMoved = (lastMove?.from.r === r && lastMove?.from.c === c) || (lastMove?.to.r === r && lastMove?.to.c === c);

                                            return (
                                                <div
                                                    key={`cell-${r}-${c}`}
                                                    onClick={() => handleSquareClick(r, c)}
                                                    className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-11 flex flex-col items-center justify-center relative cursor-pointer select-none transition-all ${
                                                        isDark ? 'bg-[#5c3d23]' : 'bg-[#c9a779]'
                                                    } ${
                                                        isSelected ? 'ring-2 ring-yellow-400 bg-yellow-900/60 z-10' : ''
                                                    } ${
                                                        isLastMoved ? 'ring-1 ring-amber-400/50' : ''
                                                    }`}
                                                >
                                                    {/* Move target indicator */}
                                                    {moveInfo && !moveInfo.isAttack && (
                                                        <div className="absolute w-3 h-3 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)] z-20 pointer-events-none" />
                                                    )}
                                                    {moveInfo && moveInfo.isAttack && (
                                                        <div className="absolute inset-0.5 border-2 border-red-500 rounded bg-red-900/40 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-20 pointer-events-none animate-pulse flex items-center justify-center">
                                                            <Swords className="w-3.5 h-3.5 text-red-300 drop-shadow" />
                                                        </div>
                                                    )}

                                                    {/* Pawn Piece Render with HP Bar */}
                                                    {cell && (
                                                        <motion.div
                                                            initial={{ scale: 0.8 }}
                                                            animate={{ scale: isSelected ? 1.15 : 1 }}
                                                            className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex flex-col items-center justify-center shadow-md relative z-10 ${
                                                                cell.owner === 'player'
                                                                    ? 'bg-gradient-to-tr from-amber-700 via-yellow-500 to-amber-200 text-stone-950 border border-yellow-200'
                                                                    : 'bg-gradient-to-tr from-purple-950 via-slate-800 to-purple-600 text-white border border-purple-400'
                                                            }`}
                                                            title={`${cell.name} (${cell.hp}/${cell.maxHp} HP)`}
                                                        >
                                                            <span className="text-xs sm:text-sm leading-none drop-shadow">
                                                                {cell.isKing ? '👑' : cell.type === 'combat' ? '⚔️' : '🔮'}
                                                            </span>
                                                            
                                                            {/* Mini HP text badge */}
                                                            <div className="absolute -bottom-1 inset-x-0 flex justify-center">
                                                                <span className={`px-1 rounded text-[6px] sm:text-[7px] font-black leading-none ${
                                                                    cell.hp > 10 ? 'bg-black/90 text-emerald-300' : 'bg-red-950 text-red-300 border border-red-500/50'
                                                                }`}>
                                                                    {cell.hp}
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Column Letters Bottom */}
                            <div className="flex justify-around mt-1 text-[10px] font-bold text-amber-400 font-mono">
                                {COL_LABELS.map(col => (
                                    <span key={`col-bot-${col}`} className="w-8 sm:w-10 text-center">{col}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Battle Logs, Unit Info & Rules */}
                    <div className="w-full md:w-80 p-3 sm:p-4 bg-[#18110c] border-t md:border-t-0 md:border-l border-[#b8860b]/30 flex flex-col justify-between overflow-hidden">
                        <div>
                            <h3 className="font-serif font-black text-sm text-amber-300 flex items-center gap-1.5 mb-2">
                                <Flame className="w-4 h-4 text-orange-400" />
                                <span>Бойовий літопис 6х12:</span>
                            </h3>

                            {/* Logs list */}
                            <div className="h-44 sm:h-64 overflow-y-auto space-y-1.5 p-2 bg-[#100a06] rounded-xl border border-stone-800 text-[11px] text-stone-300 scrollbar-thin scrollbar-thumb-amber-600/40">
                                {battleLogs.map((log, idx) => (
                                    <div key={`log-${idx}`} className="leading-snug border-b border-stone-800/60 pb-1">
                                        {log}
                                    </div>
                                ))}
                            </div>

                            {/* Unit Quick Info */}
                            <div className="mt-3 p-2.5 rounded-xl bg-[#22160e] border border-amber-500/30 text-xs space-y-1.5">
                                <div className="font-bold text-amber-200 text-[11px] uppercase tracking-wider flex items-center gap-1">
                                    <Dices className="w-3.5 h-3.5 text-yellow-400" />
                                    <span>Правила двобою фігур:</span>
                                </div>
                                <div className="text-[11px] text-stone-300 leading-tight">
                                    • <strong>Здоров'я:</strong> У кожного пішака <strong>20 HP</strong>.
                                </div>
                                <div className="text-[11px] text-stone-300 leading-tight">
                                    • <strong>Атака:</strong> Атакуючий кидає <strong>1d10</strong>, потім кидає стільки монет.
                                </div>
                                <div className="text-[11px] text-stone-300 leading-tight">
                                    • <strong>Захист:</strong> Захисник теж кидає <strong>1d10</strong> і стільки монет.
                                </div>
                                <div className="text-[11px] text-stone-300 leading-tight">
                                    • <strong>Шкода:</strong> Якщо монет (орлів) в атакуючого більше — різниця наноситься як шкода пішаку!
                                </div>
                            </div>
                        </div>

                        {/* Surrender / Resign button */}
                        <div className="pt-3 border-t border-stone-800 flex gap-2">
                            <button
                                onClick={() => handlePlayerDefeat('Гравець здався у поєдинку.')}
                                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-rose-300 rounded-xl text-xs font-bold transition-all border border-stone-700"
                            >
                                Визнати поразку
                            </button>
                        </div>
                    </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* ACTIVE 1d10 + COIN TOSS DUEL OVERLAY (MODAL VIEW) */}
                {/* ------------------------------------------------------------- */}
                <AnimatePresence>
                    {clashState && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-0 z-60 bg-[#100906]/95 backdrop-blur-md p-3 sm:p-6 flex flex-col justify-between overflow-y-auto"
                        >
                            {/* Duel Top Header */}
                            <div className="p-3 bg-gradient-to-r from-red-950/80 via-[#24140e] to-red-950/80 border border-red-500/50 rounded-2xl flex items-center justify-between gap-3 shadow-xl shrink-0">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-3xl p-1.5 bg-black/50 border border-amber-500/40 rounded-xl">
                                        ⚔️
                                    </span>
                                    <div>
                                        <div className="font-serif font-black text-sm sm:text-base text-amber-300 flex items-center gap-2 flex-wrap">
                                            <span>Сутичка Пішаків: 1d10 + Дзвін Монет!</span>
                                            <span className="px-2 py-0.5 rounded-full bg-red-950 border border-red-500 text-red-200 text-xs font-black">
                                                Раунд {clashState.roundNumber}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                                clashState.isPlayerAttacker
                                                    ? 'bg-amber-950 border border-amber-500 text-amber-300'
                                                    : 'bg-blue-950 border border-blue-500 text-blue-300'
                                            }`}>
                                                {clashState.isPlayerAttacker ? '⚔️ Ви атакуєте' : '🛡️ Ви захищаєтесь'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-stone-300 mt-0.5">
                                            Атакуючий: <strong className="text-amber-200">{clashState.attackerPiece.name}</strong> • 
                                            Захисник: <strong className="text-purple-300">{clashState.defenderPiece.name}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Combatants VS Arena View */}
                            <div className="my-3 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-center justify-center">
                                {/* Attacker Box */}
                                <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between h-full bg-[#1c110a]/90 shadow-xl ${
                                    clashState.phase === 'attacker_dice' || clashState.phase === 'attacker_coins'
                                        ? 'border-amber-400 ring-2 ring-amber-500/40'
                                        : 'border-stone-800'
                                }`}>
                                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-3xl p-2 rounded-xl bg-amber-950/80 border border-amber-500/50">
                                                {clashState.attackerPiece.type === 'combat' ? '⚔️' : '🔮'}
                                            </span>
                                            <div>
                                                <h4 className="font-serif font-black text-sm text-amber-300">
                                                    {clashState.attackerPiece.name}
                                                </h4>
                                                <span className="text-[10px] text-amber-400/80 uppercase font-black">
                                                    ⚔️ АТАКУЮЧИЙ ({clashState.isPlayerAttacker ? 'Ви' : opponent.name})
                                                </span>
                                            </div>
                                        </div>

                                        {/* HP Bar */}
                                        <div className="text-right">
                                            <div className="text-xs font-black text-emerald-400 flex items-center gap-1 justify-end">
                                                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                                                <span>{clashState.attackerPiece.hp} / {MAX_PAWN_HP} HP</span>
                                            </div>
                                            <div className="w-24 h-2 rounded-full bg-stone-900 border border-stone-700 overflow-hidden mt-1">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-300"
                                                    style={{ width: `${(clashState.attackerPiece.hp / MAX_PAWN_HP) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attacker Dice & Coins Area */}
                                    <div className="my-3 flex flex-col items-center justify-center p-3 rounded-xl bg-[#120a06] border border-amber-500/20 min-h-[140px]">
                                        <div className="flex items-center gap-4 mb-2">
                                            {/* 1d10 Dice Display */}
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] text-stone-400 mb-1 font-bold">Кидок 1d10</span>
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg border-2 ${
                                                    clashState.attackerDice !== null
                                                        ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-950 border-yellow-200'
                                                        : 'bg-stone-900 text-stone-500 border-stone-700'
                                                } ${clashState.isRolling && (clashState.phase === 'attacker_dice') ? 'animate-spin' : ''}`}>
                                                    {clashState.attackerDice !== null ? clashState.attackerDice : '🎲'}
                                                </div>
                                            </div>

                                            {/* Coins Heads Count */}
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] text-amber-300 mb-1 font-bold">Успіхи атаки (👑)</span>
                                                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border-2 border-amber-500 flex items-center justify-center text-xl font-black text-amber-200 shadow-inner">
                                                    {clashState.attackerHeads !== null ? clashState.attackerHeads : '—'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Flipped Coins Rendering */}
                                        {clashState.attackerCoins && (
                                            <div className="flex justify-center gap-1.5 flex-wrap max-h-20 overflow-y-auto mt-1 p-1">
                                                {clashState.attackerCoins.map((coin, idx) => (
                                                    <motion.div
                                                        key={`att-coin-${idx}`}
                                                        initial={{ rotateY: 0, scale: 0.5 }}
                                                        animate={{ rotateY: 360, scale: 1 }}
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border shadow-md ${
                                                            coin === 'heads'
                                                                ? 'bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 text-stone-950 border-yellow-200 ring-1 ring-yellow-400'
                                                                : 'bg-stone-800 text-stone-400 border-stone-600 opacity-60'
                                                        }`}
                                                        title={coin === 'heads' ? 'Орел (Успіх)' : 'Решка (Промах)'}
                                                    >
                                                        {coin === 'heads' ? '👑' : '🪙'}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action button for Attacker */}
                                    <div>
                                        {clashState.phase === 'attacker_dice' && clashState.isPlayerAttacker && (
                                            <button
                                                onClick={handleAttackerRollDice}
                                                disabled={clashState.isRolling}
                                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-stone-950 font-black text-sm shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                                            >
                                                <Dices className="w-4 h-4" />
                                                <span>Кинути 1d10 для атаки!</span>
                                            </button>
                                        )}

                                        {clashState.phase === 'attacker_coins' && clashState.isPlayerAttacker && (
                                            <button
                                                onClick={handleAttackerFlipCoins}
                                                disabled={clashState.isFlipping}
                                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-stone-950 font-black text-sm shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                                            >
                                                <Coins className="w-4 h-4" />
                                                <span>Підкинути {clashState.attackerDice} монет атаки!</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Defender Box */}
                                <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between h-full bg-[#1c110a]/90 shadow-xl ${
                                    clashState.phase === 'defender_dice' || clashState.phase === 'defender_coins'
                                        ? 'border-blue-400 ring-2 ring-blue-500/40'
                                        : 'border-stone-800'
                                }`}>
                                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-3xl p-2 rounded-xl bg-purple-950/80 border border-purple-500/50">
                                                {clashState.defenderPiece.type === 'combat' ? '⚔️' : '🔮'}
                                            </span>
                                            <div>
                                                <h4 className="font-serif font-black text-sm text-purple-300">
                                                    {clashState.defenderPiece.name}
                                                </h4>
                                                <span className="text-[10px] text-blue-400/80 uppercase font-black">
                                                    🛡️ ЗАХИСНИК ({!clashState.isPlayerAttacker ? 'Ви' : opponent.name})
                                                </span>
                                            </div>
                                        </div>

                                        {/* HP Bar */}
                                        <div className="text-right">
                                            <div className="text-xs font-black text-emerald-400 flex items-center gap-1 justify-end">
                                                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                                                <span>{clashState.defenderPiece.hp} / {MAX_PAWN_HP} HP</span>
                                            </div>
                                            <div className="w-24 h-2 rounded-full bg-stone-900 border border-stone-700 overflow-hidden mt-1">
                                                <div 
                                                    className={`h-full transition-all duration-300 ${
                                                        clashState.defenderPiece.hp > 10
                                                            ? 'bg-gradient-to-r from-emerald-600 to-green-400'
                                                            : 'bg-gradient-to-r from-rose-600 to-red-400'
                                                    }`}
                                                    style={{ width: `${(clashState.defenderPiece.hp / MAX_PAWN_HP) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Defender Dice & Coins Area */}
                                    <div className="my-3 flex flex-col items-center justify-center p-3 rounded-xl bg-[#120a06] border border-purple-500/20 min-h-[140px]">
                                        <div className="flex items-center gap-4 mb-2">
                                            {/* 1d10 Dice Display */}
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] text-stone-400 mb-1 font-bold">Кидок 1d10</span>
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg border-2 ${
                                                    clashState.defenderDice !== null
                                                        ? 'bg-gradient-to-tr from-blue-600 to-sky-400 text-stone-950 border-blue-200'
                                                        : 'bg-stone-900 text-stone-500 border-stone-700'
                                                } ${clashState.isRolling && (clashState.phase === 'defender_dice') ? 'animate-spin' : ''}`}>
                                                    {clashState.defenderDice !== null ? clashState.defenderDice : '🎲'}
                                                </div>
                                            </div>

                                            {/* Coins Heads Count */}
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] text-blue-300 mb-1 font-bold">Успіхи оборони (🛡️)</span>
                                                <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border-2 border-blue-500 flex items-center justify-center text-xl font-black text-blue-200 shadow-inner">
                                                    {clashState.defenderHeads !== null ? clashState.defenderHeads : '—'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Flipped Coins Rendering */}
                                        {clashState.defenderCoins && (
                                            <div className="flex justify-center gap-1.5 flex-wrap max-h-20 overflow-y-auto mt-1 p-1">
                                                {clashState.defenderCoins.map((coin, idx) => (
                                                    <motion.div
                                                        key={`def-coin-${idx}`}
                                                        initial={{ rotateY: 0, scale: 0.5 }}
                                                        animate={{ rotateY: 360, scale: 1 }}
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border shadow-md ${
                                                            coin === 'heads'
                                                                ? 'bg-gradient-to-br from-blue-300 via-sky-500 to-indigo-600 text-white border-blue-200 ring-1 ring-sky-400'
                                                                : 'bg-stone-800 text-stone-400 border-stone-600 opacity-60'
                                                        }`}
                                                        title={coin === 'heads' ? 'Орел (Успішний блок)' : 'Решка (Промах)'}
                                                    >
                                                        {coin === 'heads' ? '🛡️' : '🪙'}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action button for Defender */}
                                    <div>
                                        {clashState.phase === 'defender_dice' && !clashState.isPlayerAttacker && (
                                            <button
                                                onClick={handleDefenderRollDice}
                                                disabled={clashState.isRolling}
                                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 text-white font-black text-sm shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                                            >
                                                <Dices className="w-4 h-4" />
                                                <span>Кинути 1d10 для захисту!</span>
                                            </button>
                                        )}

                                        {clashState.phase === 'defender_coins' && !clashState.isPlayerAttacker && (
                                            <button
                                                onClick={handleDefenderFlipCoins}
                                                disabled={clashState.isFlipping}
                                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-sky-600 text-white font-black text-sm shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                                            >
                                                <Coins className="w-4 h-4" />
                                                <span>Підкинути {clashState.defenderDice} монет оборони!</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status Bar & Resolution Controls */}
                            <div className="p-3 bg-[#1e130c] border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg">
                                <span className="font-bold text-amber-200 flex items-center gap-2 text-center sm:text-left">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                                    <span>{clashState.statusMsg}</span>
                                </span>

                                {clashState.phase === 'resolved' && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        {clashState.defenderPiece.hp > 0 ? (
                                            <button
                                                onClick={handleFinishClash}
                                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black text-xs shadow-xl cursor-pointer flex items-center gap-1.5 hover:scale-105 transition-transform"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                                <span>Завершити хід (Повернутися до дошки) ➡️</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleFinishClash}
                                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-stone-950 font-black text-xs shadow-xl cursor-pointer flex items-center gap-1.5 hover:scale-105 transition-transform"
                                            >
                                                <span>Завершити сутичку (Перемога) 🏆</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ------------------------------------------------------------- */}
                {/* GAME OVER (VICTORY / DEFEAT) OVERLAY */}
                {/* ------------------------------------------------------------- */}
                <AnimatePresence>
                    {gameResult && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                        >
                            <span className="text-6xl mb-3">
                                {gameResult === 'victory' ? '🏆' : '💀'}
                            </span>
                            <h3 className={`font-serif font-black text-3xl sm:text-4xl mb-2 ${
                                gameResult === 'victory'
                                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400'
                                    : 'text-rose-400'
                            }`}>
                                {gameResult === 'victory' ? 'Грандіозна Перемога!' : 'Поразка у Битві!'}
                            </h3>
                            <p className="text-sm text-stone-300 max-w-md mb-6 leading-relaxed">
                                {gameResult === 'victory'
                                    ? 'Ви розгромили військо супротивника на шахівниці 6х12 завдяки влучним кидкам 1d10 та монет!'
                                    : 'Супротивник здолав ваших пішаків на дошці 6х12. Спробуйте іншу стратегію!'}
                            </p>

                            {gameResult === 'victory' && (
                                <div className="flex items-center gap-4 p-3 bg-amber-950/60 border border-amber-500/50 rounded-2xl mb-6 text-xs text-amber-200">
                                    <span>💰 +60 Золота</span>
                                    <span>🧩 +10 Уламків</span>
                                    <span>🎟️ +1 Токен Магазину</span>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={initBoard}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-stone-950 font-black text-sm shadow-xl hover:scale-105 transition-transform"
                                >
                                    Зіграти ще раз
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-sm transition-colors border border-stone-600"
                                >
                                    Вийти
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ------------------------------------------------------------- */}
                {/* RULES MODAL */}
                {/* ------------------------------------------------------------- */}
                <AnimatePresence>
                    {showRules && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute inset-x-4 top-16 bottom-4 z-40 bg-[#160f0a]/95 border-2 border-amber-500/60 rounded-2xl p-5 overflow-y-auto text-xs text-stone-200 space-y-3 shadow-2xl backdrop-blur-md"
                        >
                            <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                                <h4 className="font-serif font-black text-base text-amber-300 flex items-center gap-2">
                                    <span>📜</span> Правила «Битви Пішаків 6х12: 1d10 та Монети»
                                </h4>
                                <button onClick={() => setShowRules(false)} className="p-1 text-stone-400 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p>
                                <strong>Дошка 6х12:</strong> 6 вертикалей (A-F) та 12 горизонталей. Гравець грає знизу (горизонталі 11 і 12), супротивник — зверху (горизонталі 1 і 2).
                            </p>
                            <p>
                                <strong>Склад сил:</strong> У кожного гравця по <strong>6 бойових пішаків (⚔️)</strong> та <strong>6 магічних пішаків (🔮)</strong>. Усі мають по <strong>20 очок здоров'я (20 HP)</strong>.
                            </p>
                            <p>
                                <strong>Рух:</strong> Пішаки ходять прямо вперед на 1 клітинку (або на 2 клітинки зі стартової позиції), якщо клітинка вільна.
                            </p>
                            <p>
                                <strong>Атака бойових пішаків (⚔️):</strong> Б'ють ворожу фігуру на одну клітинку вперед по діагоналі.
                            </p>
                            <p>
                                <strong>Атака магічних пішаків (🔮):</strong> Б'ють через одну клітинку (дистанція 2) — прямо через фігуру, по діагоналі або з флангу!
                            </p>
                            <p>
                                <strong>Правила двобою фігур (1d10 + Монети):</strong>
                                <br />
                                1. Атакуючий кидає <strong>1d10</strong>, потім підкидає стільки монет. Рахується кількість орлів (👑 успіхи атаки).
                                <br />
                                2. Захисник кидає <strong>1d10</strong> і теж підкидає стільки монет. Рахується кількість орлів (🛡️ успіхи оборони).
                                <br />
                                3. Якщо кількість монет атакуючого більша за кількість монет захисника — <strong>різниця наноситься як шкода пішаку</strong>!
                                <br />
                                4. Якщо здоров'я пішака опускається до 0 — він гине і знімається з дошки. Якщо виживає — бій можна продовжити або завершити хід.
                            </p>
                            <p>
                                <strong>Перемога у грі:</strong> Знищити всі 12 фігур супротивника АБО провести хоча б одного свого пішака до протилежного краю дошки!
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

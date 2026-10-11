import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ToySoldier, WorldProgress, OpponentData } from '../types';
import { 
    getCheckersSquadMaxHp, 
    getCheckersSquadMaxSoldiers, 
    createCheckersSquad,
    createStarterCheckersSquads12, 
    decompressCheckersSquadToCompanions,
    applySquadExpAndLevelUp,
    createMilitarySquad,
    createStarterMilitarySquads12,
    applyMilitarySquadExpAndLevelUp,
    getMilitarySquadPerkLabel,
    getMilitarySquadReplenishCost
} from '../lib/toySoldiersData';
import { playGoldSound, playLevelUpSound } from '../lib/soundEffects';
import { saveWorldProgress } from '../lib/worldData';
import { 
    X, 
    Swords, 
    Shield, 
    Sparkles, 
    Award, 
    Trophy, 
    Flame, 
    AlertTriangle, 
    RefreshCw, 
    Zap, 
    Crown, 
    Heart, 
    Info, 
    ArrowRight,
    ChevronRight,
    Users,
    Check,
    Coins
} from 'lucide-react';

interface CheckersWarModalProps {
    isOpen: boolean;
    onClose: () => void;
    opponent: OpponentData;
    tavernName: string;
    progress: WorldProgress;
    onUpdateProgress: (newProgress: WorldProgress) => void;
    onVictory: (updatedProgress: WorldProgress) => void;
    onDefeat: (updatedProgress: WorldProgress) => void;
    variant?: 'checkers_war' | 'aranian_checkers_war' | 'military_checkers' | 'aranian_military_checkers';
    onOpenToyShop?: () => void;
}

// Global Board Squad Piece
export interface GlobalSquadPiece {
    id: string;
    squadRef: ToySoldier;
    side: 'player' | 'ai';
    row: number;
    col: number;
    isKing: boolean;
    soldierHps: number[]; // HP of each living soldier in this squad
    maxSoldierHp: number;
}

// Tactical Sub-Battle Soldier Piece
export interface TacticalSoldierPiece {
    id: string;
    soldierIndex: number;
    side: 'attacker' | 'defender';
    row: number;
    col: number;
    isKing: boolean;
    hp: number;
    maxHp: number;
}

export function CheckersWarModal({
    isOpen,
    onClose,
    opponent,
    tavernName,
    progress,
    onUpdateProgress,
    onVictory,
    onDefeat,
    variant = 'checkers_war',
    onOpenToyShop
}: CheckersWarModalProps) {
    const isAranian = variant === 'aranian_checkers_war' || variant === 'aranian_military_checkers';
    const isCoinBattle = variant === 'military_checkers' || variant === 'aranian_military_checkers';

    // Global board state
    const progressRef = React.useRef(progress);
    progressRef.current = progress;

    const deployedPlayerSquadIdsRef = React.useRef<Set<string>>(new Set());

    const [globalSquads, setGlobalSquads] = useState<GlobalSquadPiece[]>([]);
    const [selectedGlobalPieceId, setSelectedGlobalPieceId] = useState<string | null>(null);
    const [playerRetreatedSquads, setPlayerRetreatedSquads] = useState<GlobalSquadPiece[]>([]);
    const [aiRetreatedSquads, setAiRetreatedSquads] = useState<GlobalSquadPiece[]>([]);
    const [selectedRetreatedPieceId, setSelectedRetreatedPieceId] = useState<string | null>(null);
    const [turn, setTurn] = useState<'player' | 'ai'>('player');
    const [battleLogs, setActionLogs] = useState<string[]>([]);
    const [gameOver, setGameOver] = useState<'victory' | 'defeat' | null>(null);
    const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

    // Coin Battle state for military checkers (120 soldiers)
    const [activeCoinBattle, setActiveCoinBattle] = useState<{
        attackerGlobalId: string;
        defenderGlobalId: string;
        attackerSide: 'player' | 'ai';
        attackerSquadName: string;
        defenderSquadName: string;
        attackerAvatar: string;
        defenderAvatar: string;
        attackerLevel: number;
        defenderLevel: number;
        attackerSoldiers: number;
        defenderSoldiers: number;
        targetRow: number;
        targetCol: number;
        isAranianAttack: boolean;
        phase: 'ready' | 'result';
        // Phase 1: Main Attack
        initialAttackHits?: number;
        rerollAttackHits?: number;
        totalAttackHits?: number;
        initialDefBlocks?: number;
        rerollDefBlocks?: number;
        totalDefBlocks?: number;
        damage?: number;
        defenderCasualties?: number;
        survivingDefenderSoldiers?: number;
        // Phase 2: Defender Counter-Attack
        hasCounterAttack?: boolean;
        initialCounterHits?: number;
        rerollCounterHits?: number;
        totalCounterHits?: number;
        initialAttackerBlocks?: number;
        rerollAttackerBlocks?: number;
        totalAttackerBlocks?: number;
        counterDamage?: number;
        attackerCasualties?: number;
        survivingAttackerSoldiers?: number;
        // Outcomes
        attackerWon?: boolean;
        defenderCounterWon?: boolean;
        bothDestroyed?: boolean;
        bothSurvived?: boolean;
        logs: string[];
    } | null>(null);

    // Tactical Sub-Battle state
    const [activeSubBattle, setActiveSubBattle] = useState<{
        attackerGlobalId: string;
        defenderGlobalId: string;
        attackerSide: 'player' | 'ai';
        attackerSquadName: string;
        defenderSquadName: string;
        attackerSoldierHps: number[];
        defenderSoldierHps: number[];
        tacticalPieces: TacticalSoldierPiece[];
        turn: 'attacker' | 'defender';
        selectedTacticalPieceId: string | null;
        targetGlobalRow: number;
        targetGlobalCol: number;
        logs: string[];
    } | null>(null);

    // Initial setup on open
    useEffect(() => {
        if (!isOpen) return;

        if (isCoinBattle) {
            // Get player squads from toySoldiers with isMilitarySquad
            let ownedSquads = (progress.toySoldiers || []).filter(s => (s.isMilitarySquad || s.type === 'військова_шашка_загін') && (s.deaths || 0) < 3);

            if (ownedSquads.length < 12) {
                const needed = 12 - ownedSquads.length;
                const extraSquads: ToySoldier[] = [];
                const avatars = ['🛡️', '⚔️', '🪙', '⚜️', '🚩', '🦅', '🛡️', '⚔️', '🪙', '⚜️', '🚩', '🦅'];
                for (let i = 0; i < needed; i++) {
                    extraSquads.push(createMilitarySquad(`Легіон Загін #${ownedSquads.length + i + 1}`, avatars[(ownedSquads.length + i) % avatars.length], 150, i));
                }
                const fullCollection = [...(progress.toySoldiers || []), ...extraSquads];
                const updatedProgress = { ...progress, toySoldiers: fullCollection };
                onUpdateProgress(updatedProgress);
                saveWorldProgress(updatedProgress);
                ownedSquads = [...ownedSquads, ...extraSquads];
            }

            let playerSquadList: ToySoldier[] = ownedSquads.slice(0, 12);
            const aiSquadList = createStarterMilitarySquads12(opponent.name);

            const newGlobalSquads: GlobalSquadPiece[] = [];

            // AI Squads on rows 0, 1, 2
            let aiIdx = 0;
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 8; c++) {
                    if ((r + c) % 2 === 1 && aiIdx < 12) {
                        const squad = aiSquadList[aiIdx];
                        const soldiers = squad.soldiersCount ?? 120;
                        newGlobalSquads.push({
                            id: `ai_squad_${aiIdx + 1}`,
                            squadRef: squad,
                            side: 'ai',
                            row: r,
                            col: c,
                            isKing: false,
                            soldierHps: Array(soldiers).fill(1),
                            maxSoldierHp: 1
                        });
                        aiIdx++;
                    }
                }
            }

            // Player Squads on rows 5, 6, 7
            let pIdx = 0;
            for (let r = 5; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if ((r + c) % 2 === 1 && pIdx < 12) {
                        const squad = playerSquadList[pIdx];
                        const soldiers = squad.soldiersCount ?? 120;
                        newGlobalSquads.push({
                            id: `player_squad_${squad.id || pIdx + 1}`,
                            squadRef: squad,
                            side: 'player',
                            row: r,
                            col: c,
                            isKing: false,
                            soldierHps: Array(soldiers).fill(1),
                            maxSoldierHp: 1
                        });
                        pIdx++;
                    }
                }
            }

            setGlobalSquads(newGlobalSquads);
            deployedPlayerSquadIdsRef.current = new Set(playerSquadList.map(s => String(s.id)));
            setSelectedGlobalPieceId(null);
            setPlayerRetreatedSquads([]);
            setAiRetreatedSquads([]);
            setSelectedRetreatedPieceId(null);
            const startingTurn: 'player' | 'ai' = Math.random() < 0.5 ? 'player' : 'ai';
            setTurn(startingTurn);
            setGameOver(null);
            setActiveSubBattle(null);
            setActiveCoinBattle(null);
            const gameTitle = variant === 'aranian_military_checkers' ? 'Аранійські військові шашки (120 бійців)' : 'Військові шашки (120 бійців)';
            setActionLogs([
                `⚔️ Розпочато «${gameTitle}» проти суперника ${opponent.name}!`,
                `🛡️ У кожної шашки армія по 120 бійців! Битви вирішуються кидками монет N vs M.`,
                startingTurn === 'player' ? '👉 Ваш перший хід!' : '🤖 Першим ходить суперник!'
            ]);
            return;
        }

        // Get player squads from toySoldiers
        let ownedSquads = (progress.toySoldiers || []).filter(s => (s.isCheckersSquad || s.type === 'шашка_загін') && (s.deaths || 0) < 3);

        // If player has fewer than 12 squads, automatically generate starter squads to ensure 12 persistent squads
        if (ownedSquads.length < 12) {
            const needed = 12 - ownedSquads.length;
            const extraSquads: ToySoldier[] = [];
            const avatars = ['🔴', '🔵', '🟣', '🟢', '🟡', '🟠', '🔴', '🔵', '🟣', '🟢', '🟡', '🟠'];
            for (let i = 0; i < needed; i++) {
                extraSquads.push(createCheckersSquad(`Арсенал Загін #${ownedSquads.length + i + 1}`, avatars[(ownedSquads.length + i) % avatars.length], 120, i));
            }
            const fullCollection = [...(progress.toySoldiers || []), ...extraSquads];
            const updatedProgress = { ...progress, toySoldiers: fullCollection };
            onUpdateProgress(updatedProgress);
            saveWorldProgress(updatedProgress);
            ownedSquads = [...ownedSquads, ...extraSquads];
        }

        let playerSquadList: ToySoldier[] = ownedSquads.slice(0, 12);

        // Generate AI squads
        const aiSquadList = createStarterCheckersSquads12(opponent.name);

        const newGlobalSquads: GlobalSquadPiece[] = [];

        // AI Squads on rows 0, 1, 2
        let aiIdx = 0;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1 && aiIdx < 12) {
                    const squad = aiSquadList[aiIdx];
                    const maxHp = getCheckersSquadMaxHp(squad);
                    const soldiers = squad.soldiersCount ?? 12;
                    newGlobalSquads.push({
                        id: `ai_squad_${aiIdx + 1}`,
                        squadRef: squad,
                        side: 'ai',
                        row: r,
                        col: c,
                        isKing: false,
                        soldierHps: Array(soldiers).fill(maxHp),
                        maxSoldierHp: maxHp
                    });
                    aiIdx++;
                }
            }
        }

        // Player Squads on rows 5, 6, 7
        let pIdx = 0;
        for (let r = 5; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1 && pIdx < 12) {
                    const squad = playerSquadList[pIdx];
                    const maxHp = getCheckersSquadMaxHp(squad);
                    const hps = squad.soldierHps && squad.soldierHps.length > 0
                        ? [...squad.soldierHps]
                        : Array(squad.soldiersCount || 12).fill(maxHp);

                    newGlobalSquads.push({
                        id: `player_squad_${squad.id || pIdx + 1}`,
                        squadRef: squad,
                        side: 'player',
                        row: r,
                        col: c,
                        isKing: false,
                        soldierHps: hps,
                        maxSoldierHp: maxHp
                    });
                    pIdx++;
                }
            }
        }

        setGlobalSquads(newGlobalSquads);
        deployedPlayerSquadIdsRef.current = new Set(playerSquadList.map(s => String(s.id)));
        setSelectedGlobalPieceId(null);
        setPlayerRetreatedSquads([]);
        setAiRetreatedSquads([]);
        setSelectedRetreatedPieceId(null);
        // Randomly determine who goes first (50% chance AI, 50% chance Player)
        const startingTurn: 'player' | 'ai' = Math.random() < 0.5 ? 'player' : 'ai';
        setTurn(startingTurn);
        setGameOver(null);
        setActiveSubBattle(null);
        setActionLogs([
            `⚔️ Розпочато Армійські шашки проти суперника ${opponent.name}!`,
            `👥 Обидва війська виставили по 12 армійських шашок-загонів на 8х8 дошці.`,
            startingTurn === 'player' ? `🎲 Жеребкування: Перший хід за вами!` : `🎲 Жеребкування: Перший хід за суперником ${opponent.name}!`
        ]);
    }, [isOpen]);

    // -------------------------------------------------------------------
    // REACTIVE AI TURN EFFECTS (Global & Tactical)
    // -------------------------------------------------------------------

    // Automatic trigger for Global AI turn
    useEffect(() => {
        if (!isOpen || gameOver || activeSubBattle || activeCoinBattle) return;

        if (turn === 'ai') {
            const timer = setTimeout(() => {
                triggerAiTurn(globalSquads, playerRetreatedSquads, aiRetreatedSquads);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [turn, isOpen, gameOver, activeSubBattle, activeCoinBattle, globalSquads, playerRetreatedSquads, aiRetreatedSquads]);

    // Automatic trigger for Tactical Sub-Battle AI turn
    useEffect(() => {
        if (!activeSubBattle) return;

        const aiTacticalSide: 'attacker' | 'defender' = activeSubBattle.attackerSide === 'player' ? 'defender' : 'attacker';

        if (activeSubBattle.turn === aiTacticalSide) {
            const timer = setTimeout(() => {
                triggerTacticalAiTurn(activeSubBattle);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [activeSubBattle?.turn, activeSubBattle?.attackerSide, activeSubBattle?.tacticalPieces]);

    if (!isOpen) return null;

    const addLog = (msg: string) => {
        setActionLogs(prev => [msg, ...prev.slice(0, 40)]);
    };

    // Helper: Valid global moves for a squad piece
    const getValidGlobalMoves = (piece: GlobalSquadPiece, squads: GlobalSquadPiece[]) => {
        const moves: { r: number; c: number; isJump: boolean; victimId?: string; isAranianAttack?: boolean }[] = [];

        if (isAranian) {
            // Aranian movement:
            // Normal: 1 step left, right, forward, and forward-diagonals (5 directions!)
            // Damka (King): 1 step in all 8 directions!
            // Empty square = simple move. Enemy square = attack (on victory, takes defeated squad's square)
            const dirForward = piece.side === 'player' ? -1 : 1;
            const dirs = piece.isKing
                ? [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1],           [0, 1],
                    [1, -1],  [1, 0],  [1, 1]
                  ]
                : [
                    [dirForward, 0],              // forward
                    [0, -1], [0, 1],              // left, right
                    [dirForward, -1], [dirForward, 1] // forward-diagonals
                  ];

            dirs.forEach(([dr, dc]) => {
                const nr = piece.row + dr;
                const nc = piece.col + dc;

                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                    const target = squads.find(s => s.row === nr && s.col === nc);
                    if (!target) {
                        moves.push({ r: nr, c: nc, isJump: false });
                    } else if (target.side !== piece.side) {
                        // Adjacent enemy squad: attack!
                        moves.push({ r: nr, c: nc, isJump: true, victimId: target.id, isAranianAttack: true });
                    }
                }
            });

            return moves;
        }

        // Classic Army Checkers movement:
        const dirForward = piece.side === 'player' ? -1 : 1;
        const dirs = piece.isKing 
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] 
            : [[dirForward, -1], [dirForward, 1]];

        dirs.forEach(([dr, dc]) => {
            const nr = piece.row + dr;
            const nc = piece.col + dc;

            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const target = squads.find(s => s.row === nr && s.col === nc);
                if (!target) {
                    moves.push({ r: nr, c: nc, isJump: false });
                } else if (target.side !== piece.side) {
                    // Jump attempt
                    const jnr = nr + dr;
                    const jnc = nc + dc;
                    if (jnr >= 0 && jnr < 8 && jnc >= 0 && jnc < 8) {
                        const jumpTarget = squads.find(s => s.row === jnr && s.col === jnc);
                        if (!jumpTarget) {
                            moves.push({ r: jnr, c: jnc, isJump: true, victimId: target.id });
                        }
                    }
                }
            }
        });

        return moves;
    };

    // Initiate Coin Battle between Attacker and Defender (120-soldier coin toss)
    const startCoinBattle = (
        attacker: GlobalSquadPiece, 
        defender: GlobalSquadPiece, 
        targetRow: number, 
        targetCol: number, 
        isAranianAttack?: boolean
    ) => {
        const attackerSoldiers = attacker.soldierHps.length;
        const defenderSoldiers = defender.soldierHps.length;
        const attackerLevel = attacker.squadRef.level || 0;
        const defenderLevel = defender.squadRef.level || 0;

        addLog(`🪙 Битва монет! «${attacker.squadRef.name}» (${attackerSoldiers}) атакує «${defender.squadRef.name}» (${defenderSoldiers})! (Після атаки захисник наносить контратаку!)`);

        setActiveCoinBattle({
            attackerGlobalId: attacker.id,
            defenderGlobalId: defender.id,
            attackerSide: attacker.side,
            attackerSquadName: attacker.squadRef.name,
            defenderSquadName: defender.squadRef.name,
            attackerAvatar: attacker.squadRef.avatar || '🛡️',
            defenderAvatar: defender.squadRef.avatar || '🛡️',
            attackerLevel,
            defenderLevel,
            attackerSoldiers,
            defenderSoldiers,
            targetRow,
            targetCol,
            isAranianAttack: !!isAranianAttack,
            phase: 'ready',
            logs: [
                `🪙 Початок битви монет: армії по 120 бійців!`,
                `⚔️ 1. Основна атака: ${attackerSoldiers} монет на попадання vs ${defenderSoldiers} монет на захист (шанс 50%).`,
                `⚡ 2. Контратака захисника: якщо захисник вціліє, він атакує у відповідь, а атакуючий захищається!`,
                attackerLevel >= 1 ? `✨ Загін атаки має Рівень ${attackerLevel}: ПЕРЕКИДАННЯ промахів атаки!` : '',
                defenderLevel >= 2 ? `✨ Загін захисту має Рівень ${defenderLevel}: ПЕРЕКИДАННЯ промахів захисту!` : ''
            ].filter(Boolean)
        });
    };

    // Resolve Coin Battle flips (Main Attack + Defender Counter-Attack)
    const resolveCoinBattle = (coinBattleObj = activeCoinBattle) => {
        if (!coinBattleObj) return;

        const { 
            attackerSoldiers, 
            defenderSoldiers, 
            attackerLevel, 
            defenderLevel,
            attackerSquadName,
            defenderSquadName 
        } = coinBattleObj;

        // --------------------------------------------------------
        // ЕТАП 1: ОСНОВНА АТАКА (Атакуючий б'є -> Захисник захищається)
        // --------------------------------------------------------
        let initialAtkHits = 0;
        for (let i = 0; i < attackerSoldiers; i++) {
            if (Math.random() < 0.5) initialAtkHits++;
        }
        const atkMisses = attackerSoldiers - initialAtkHits;
        let rerollAtkHits = 0;
        if (attackerLevel >= 1) {
            for (let i = 0; i < atkMisses; i++) {
                if (Math.random() < 0.5) rerollAtkHits++;
            }
        }
        const totalAttackHits = initialAtkHits + rerollAtkHits;

        let initialDefBlocks = 0;
        for (let i = 0; i < defenderSoldiers; i++) {
            if (Math.random() < 0.5) initialDefBlocks++;
        }
        const defMisses = defenderSoldiers - initialDefBlocks;
        let rerollDefBlocks = 0;
        if (defenderLevel >= 2) {
            for (let i = 0; i < defMisses; i++) {
                if (Math.random() < 0.5) rerollDefBlocks++;
            }
        }
        const totalDefBlocks = initialDefBlocks + rerollDefBlocks;

        const damage = Math.max(0, totalAttackHits - totalDefBlocks);
        const defenderCasualties = Math.min(defenderSoldiers, damage);
        const survivingDefenderSoldiers = defenderSoldiers - defenderCasualties;

        // --------------------------------------------------------
        // ЕТАП 2: КОНТРАТАКА ЗАХИСНИКА (Вцілілий захисник контратакує -> Атакуючий захищається)
        // --------------------------------------------------------
        let hasCounterAttack = false;
        let initialCounterHits = 0;
        let rerollCounterHits = 0;
        let totalCounterHits = 0;
        let initialAttackerBlocks = 0;
        let rerollAttackerBlocks = 0;
        let totalAttackerBlocks = 0;
        let counterDamage = 0;
        let attackerCasualties = 0;
        let survivingAttackerSoldiers = attackerSoldiers;

        if (survivingDefenderSoldiers > 0) {
            hasCounterAttack = true;
            // Defender attacks with surviving soldiers
            for (let i = 0; i < survivingDefenderSoldiers; i++) {
                if (Math.random() < 0.5) initialCounterHits++;
            }
            const counterMisses = survivingDefenderSoldiers - initialCounterHits;
            if (defenderLevel >= 1) { // Level 1 perk: attack coin reroll
                for (let i = 0; i < counterMisses; i++) {
                    if (Math.random() < 0.5) rerollCounterHits++;
                }
            }
            totalCounterHits = initialCounterHits + rerollCounterHits;

            // Attacker defends against counter-attack with its soldiers
            for (let i = 0; i < attackerSoldiers; i++) {
                if (Math.random() < 0.5) initialAttackerBlocks++;
            }
            const attDefMisses = attackerSoldiers - initialAttackerBlocks;
            if (attackerLevel >= 2) { // Level 2 perk: defense coin reroll
                for (let i = 0; i < attDefMisses; i++) {
                    if (Math.random() < 0.5) rerollAttackerBlocks++;
                }
            }
            totalAttackerBlocks = initialAttackerBlocks + rerollAttackerBlocks;

            counterDamage = Math.max(0, totalCounterHits - totalAttackerBlocks);
            attackerCasualties = Math.min(attackerSoldiers, counterDamage);
            survivingAttackerSoldiers = attackerSoldiers - attackerCasualties;
        }

        const attackerWon = survivingDefenderSoldiers <= 0 && survivingAttackerSoldiers > 0;
        const defenderCounterWon = survivingAttackerSoldiers <= 0 && survivingDefenderSoldiers > 0;
        const bothDestroyed = survivingDefenderSoldiers <= 0 && survivingAttackerSoldiers <= 0;
        const bothSurvived = survivingDefenderSoldiers > 0 && survivingAttackerSoldiers > 0;

        playGoldSound();

        const battleLogs = [
            `⚔️ [1. ОСНОВНА АТАКА] «${attackerSquadName}»: ${initialAtkHits} попадань${attackerLevel >= 1 ? ` (+${rerollAtkHits} перекид)` : ''} = ${totalAttackHits}.`,
            `🛡️ [1. ЗАХИСТ] «${defenderSquadName}»: ${initialDefBlocks} блоків${defenderLevel >= 2 ? ` (+${rerollDefBlocks} перекид)` : ''} = ${totalDefBlocks}.`,
            damage > 0 
                ? `💥 Пошкодження захисника: -${defenderCasualties} бійців! (Вціліло: ${survivingDefenderSoldiers}/120)`
                : `🛡️ Захисники відбили перший удар! Всі ${defenderSoldiers} бійців неушкоджені.`
        ];

        if (hasCounterAttack) {
            battleLogs.push(
                `⚡ [2. КОНТРАТАКА] Вцілілий захисник «${defenderSquadName}» (${survivingDefenderSoldiers} бійців) наносить контрудар: ${initialCounterHits} попадань${defenderLevel >= 1 ? ` (+${rerollCounterHits} перекид)` : ''} = ${totalCounterHits}!`,
                `🛡️ [2. ЗАХИСТ АТАКУЮЧОГО] «${attackerSquadName}» захищається: ${initialAttackerBlocks} блоків${attackerLevel >= 2 ? ` (+${rerollAttackerBlocks} перекид)` : ''} = ${totalAttackerBlocks}.`,
                counterDamage > 0
                    ? `🩸 Втрати атакуючого від контратаки: -${attackerCasualties} бійців! (Вціліло: ${survivingAttackerSoldiers}/120)`
                    : `🛡️ Атакуючий повністю захистився від контратаки без втрат!`
            );
        } else {
            battleLogs.push(`💀 Загін «${defenderSquadName}» повністю знищено першим ударом — контратаку не нанесено!`);
        }

        if (attackerWon) {
            battleLogs.push(`🏆 ПЕРЕМОГА АТАКИ! Загін «${attackerSquadName}» знищив ворога і просувається вперед!`);
        } else if (defenderCounterWon) {
            battleLogs.push(`🛡️ ПЕРЕМОГА КОНТРАТАКИ! Загін «${defenderSquadName}» відбив атаку і повністю розгромив атакуючих!`);
        } else if (bothSurvived) {
            battleLogs.push(`🤝 ОБИДВА ЗАГОНИ ВЦІЛІЛИ! Обидві сторони обмінялися ударами і залишаються на позиціях.`);
        } else if (bothDestroyed) {
            battleLogs.push(`☠️ ВЗАЄМНЕ ЗНИЩЕННЯ! Обидва загони полягли в кровопролитному бою.`);
        }

        setActiveCoinBattle({
            ...coinBattleObj,
            phase: 'result',
            initialAttackHits: initialAtkHits,
            rerollAttackHits: rerollAtkHits,
            totalAttackHits,
            initialDefBlocks,
            rerollDefBlocks,
            totalDefBlocks,
            damage,
            defenderCasualties,
            survivingDefenderSoldiers,
            hasCounterAttack,
            initialCounterHits,
            rerollCounterHits,
            totalCounterHits,
            initialAttackerBlocks,
            rerollAttackerBlocks,
            totalAttackerBlocks,
            counterDamage,
            attackerCasualties,
            survivingAttackerSoldiers,
            attackerWon,
            defenderCounterWon,
            bothDestroyed,
            bothSurvived,
            logs: battleLogs
        });
    };

    // Apply Coin Battle Results to global board and squad progression
    const applyCoinBattleResult = () => {
        if (!activeCoinBattle || activeCoinBattle.phase !== 'result') return;

        const { 
            attackerGlobalId, 
            defenderGlobalId, 
            attackerWon, 
            defenderCounterWon,
            bothDestroyed,
            targetRow, 
            targetCol, 
            defenderCasualties = 0,
            attackerCasualties = 0 
        } = activeCoinBattle;

        const attacker = globalSquads.find(s => s.id === attackerGlobalId);
        const defender = globalSquads.find(s => s.id === defenderGlobalId);
        if (!attacker || !defender) {
            setActiveCoinBattle(null);
            return;
        }

        const currentDefenderSoldiers = defender.soldierHps.length;
        const currentAttackerSoldiers = attacker.soldierHps.length;
        const newDefCount = Math.max(0, currentDefenderSoldiers - defenderCasualties);
        const newAttCount = Math.max(0, currentAttackerSoldiers - attackerCasualties);

        // Experience & level up
        const attExp = attackerWon ? 3 : (newAttCount > 0 ? 1 : 0);
        const defExp = defenderCounterWon ? 3 : (newDefCount > 0 ? 1 : 0);

        const { updatedSquad: updatedAttackerRef, leveledUp: attLvlUp } = applyMilitarySquadExpAndLevelUp(
            attacker.squadRef, 
            Math.max(1, attExp)
        );
        if (attLvlUp) {
            playLevelUpSound();
            addLog(`✨ ЗАГІН ЗДОБУВ РІВЕНЬ! Загін «${attacker.squadRef.name}» досяг рівня ${updatedAttackerRef.level}!`);
        }

        const { updatedSquad: updatedDefenderRef, leveledUp: defLvlUp } = applyMilitarySquadExpAndLevelUp(
            defender.squadRef, 
            Math.max(1, defExp)
        );
        if (defLvlUp) {
            playLevelUpSound();
            addLog(`✨ ЗАГІН ЗДОБУВ РІВЕНЬ! Загін «${defender.squadRef.name}» досяг рівня ${updatedDefenderRef.level}!`);
        }

        // Persist to toySoldiers
        const updatedToySoldiers = (progress.toySoldiers || []).map(s => {
            if (s.id === updatedAttackerRef.id) {
                return {
                    ...updatedAttackerRef,
                    soldiersCount: newAttCount,
                    deaths: newAttCount <= 0 ? (s.deaths || 0) + 1 : (s.deaths || 0)
                };
            }
            if (s.id === updatedDefenderRef.id) {
                return {
                    ...updatedDefenderRef,
                    soldiersCount: newDefCount,
                    deaths: newDefCount <= 0 ? (s.deaths || 0) + 1 : (s.deaths || 0)
                };
            }
            return s;
        });

        const updatedProg = {
            ...progress,
            toySoldiers: updatedToySoldiers
        };
        onUpdateProgress(updatedProg);
        saveWorldProgress(updatedProg);

        let nextSquads = [...globalSquads];

        if (attackerWon) {
            addLog(`💥 Загін «${attacker.squadRef.name}» повністю розбив «${defender.squadRef.name}» (залишилось ${newAttCount} бійців) і зайняв позицію!`);
            nextSquads = nextSquads
                .filter(s => s.id !== defenderGlobalId)
                .map(s => s.id === attackerGlobalId ? {
                    ...s,
                    row: targetRow,
                    col: targetCol,
                    isKing: s.isKing || targetRow === (s.side === 'player' ? 0 : 7),
                    soldierHps: Array(newAttCount).fill(1),
                    squadRef: {
                        ...updatedAttackerRef,
                        soldiersCount: newAttCount
                    }
                } : s);
        } else if (defenderCounterWon) {
            addLog(`🛡️ Загін «${defender.squadRef.name}» відбив атаку і повністю розгромив атакуючих «${attacker.squadRef.name}» контратакою!`);
            nextSquads = nextSquads
                .filter(s => s.id !== attackerGlobalId)
                .map(s => s.id === defenderGlobalId ? {
                    ...s,
                    soldierHps: Array(newDefCount).fill(1),
                    squadRef: {
                        ...updatedDefenderRef,
                        soldiersCount: newDefCount
                    }
                } : s);
        } else if (bothDestroyed) {
            addLog(`☠️ Обидва загони («${attacker.squadRef.name}» та «${defender.squadRef.name}») знищили один одного в бою!`);
            nextSquads = nextSquads.filter(s => s.id !== attackerGlobalId && s.id !== defenderGlobalId);
        } else {
            // Both survived
            addLog(`🤝 Загін «${defender.squadRef.name}» відбив атаку та контратакував (вціліло ${newDefCount} бійців). Загін «${attacker.squadRef.name}» залишився на місці з ${newAttCount} бійцями.`);
            nextSquads = nextSquads.map(s => {
                if (s.id === defenderGlobalId) {
                    return {
                        ...s,
                        soldierHps: Array(newDefCount).fill(1),
                        squadRef: {
                            ...updatedDefenderRef,
                            soldiersCount: newDefCount
                        }
                    };
                }
                if (s.id === attackerGlobalId) {
                    return {
                        ...s,
                        soldierHps: Array(newAttCount).fill(1),
                        squadRef: {
                            ...updatedAttackerRef,
                            soldiersCount: newAttCount
                        }
                    };
                }
                return s;
            });
        }

        setGlobalSquads(nextSquads);
        setActiveCoinBattle(null);

        // Check victory/defeat
        const pCount = nextSquads.filter(s => s.side === 'player').length;
        const aiCount = nextSquads.filter(s => s.side === 'ai').length;

        if (aiCount === 0) {
            handleVictory(nextSquads);
        } else if (pCount === 0) {
            handleDefeat(nextSquads);
        } else {
            const nextTurn: 'player' | 'ai' = attacker.side === 'player' ? 'ai' : 'player';
            setTurn(nextTurn);
        }
    };

    // Quick Test Victory for Coin Battle
    const handleInstantPlayerVictoryCoinBattle = () => {
        if (!activeCoinBattle) return;
        const isPlayerAttacker = activeCoinBattle.attackerSide === 'player';
        if (isPlayerAttacker) {
            setActiveCoinBattle({
                ...activeCoinBattle,
                phase: 'result',
                initialAttackHits: activeCoinBattle.attackerSoldiers,
                rerollAttackHits: 0,
                totalAttackHits: activeCoinBattle.attackerSoldiers,
                initialDefBlocks: 0,
                rerollDefBlocks: 0,
                totalDefBlocks: 0,
                damage: activeCoinBattle.defenderSoldiers,
                defenderCasualties: activeCoinBattle.defenderSoldiers,
                survivingDefenderSoldiers: 0,
                hasCounterAttack: false,
                attackerCasualties: 0,
                survivingAttackerSoldiers: activeCoinBattle.attackerSoldiers,
                attackerWon: true,
                defenderCounterWon: false,
                bothDestroyed: false,
                bothSurvived: false,
                logs: [
                    '⚡ Тестова автоперемога: ворожий загін повністю знищено першим ударом!'
                ]
            });
        } else {
            setActiveCoinBattle({
                ...activeCoinBattle,
                phase: 'result',
                initialAttackHits: 0,
                rerollAttackHits: 0,
                totalAttackHits: 0,
                initialDefBlocks: activeCoinBattle.defenderSoldiers,
                rerollDefBlocks: 0,
                totalDefBlocks: activeCoinBattle.defenderSoldiers,
                damage: 0,
                defenderCasualties: 0,
                survivingDefenderSoldiers: activeCoinBattle.defenderSoldiers,
                hasCounterAttack: true,
                initialCounterHits: activeCoinBattle.defenderSoldiers,
                rerollCounterHits: 0,
                totalCounterHits: activeCoinBattle.defenderSoldiers,
                initialAttackerBlocks: 0,
                rerollAttackerBlocks: 0,
                totalAttackerBlocks: 0,
                counterDamage: activeCoinBattle.attackerSoldiers,
                attackerCasualties: activeCoinBattle.attackerSoldiers,
                survivingAttackerSoldiers: 0,
                attackerWon: false,
                defenderCounterWon: true,
                bothDestroyed: false,
                bothSurvived: false,
                logs: [
                    '⚡ Тестова автооборона: загін гравця відбив атаку і повністю розбив нападника нищівною контратакою!'
                ]
            });
        }
    };

    // Replenish selected player squad for coins
    const handleReplenishSelectedSquad = () => {
        if (!selectedPiece || selectedPiece.side !== 'player') return;
        const maxSoldiers = isCoinBattle ? 120 : (selectedPiece.squadRef.maxSoldiers || 12);
        const currentCount = selectedPiece.soldierHps.length;
        if (currentCount >= maxSoldiers) return;

        const missing = maxSoldiers - currentCount;
        const cost = isCoinBattle ? Math.ceil(missing / 2) : 40;
        if (progress.playerGold < cost) {
            addLog(`❌ Недостатньо монет для поповнення! Потрібно ${cost} монет.`);
            return;
        }

        const maxHpVal = isCoinBattle ? 1 : (selectedPiece.maxSoldierHp || 3);
        const newHps = Array(maxSoldiers).fill(maxHpVal);

        const updatedToySoldiers = (progress.toySoldiers || []).map(s => {
            if (s.id === selectedPiece.squadRef.id) {
                return {
                    ...s,
                    soldiersCount: maxSoldiers,
                    soldierHps: newHps
                };
            }
            return s;
        });

        const updatedProg: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - cost,
            toySoldiers: updatedToySoldiers
        };

        onUpdateProgress(updatedProg);
        saveWorldProgress(updatedProg);

        setGlobalSquads(prev => prev.map(s => {
            if (s.id === selectedPiece.id) {
                return {
                    ...s,
                    soldierHps: newHps,
                    squadRef: {
                        ...s.squadRef,
                        soldiersCount: maxSoldiers,
                        soldierHps: newHps
                    }
                };
            }
            return s;
        }));

        playGoldSound();
        addLog(`✅ Загін «${selectedPiece.squadRef.name}» повністю відновлено до ${maxSoldiers} бійців за ${cost} монет!`);
    };

    // Initiate Sub-Battle between Attacker and Defender
    const startSubBattle = (attacker: GlobalSquadPiece, defender: GlobalSquadPiece, targetRow: number, targetCol: number) => {
        addLog(`💥 Загін «${attacker.squadRef.name}» атакує ворожий загін «${defender.squadRef.name}»! Відкривається тактична 8х8 шахівниця!`);

        const attSoldierCount = attacker.soldierHps.length;
        const defSoldierCount = defender.soldierHps.length;
        const tacticalPieces: TacticalSoldierPiece[] = [];

        // Place Defender's soldiers on top rows (0, 1, 2)
        let defPlaced = 0;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1 && defPlaced < defSoldierCount) {
                    tacticalPieces.push({
                        id: `def_sol_${defPlaced + 1}`,
                        soldierIndex: defPlaced,
                        side: 'defender',
                        row: r,
                        col: c,
                        isKing: false,
                        hp: defender.soldierHps[defPlaced],
                        maxHp: defender.maxSoldierHp
                    });
                    defPlaced++;
                }
            }
        }

        // Place Attacker's soldiers on bottom rows (5, 6, 7)
        let attPlaced = 0;
        for (let r = 5; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1 && attPlaced < attSoldierCount) {
                    tacticalPieces.push({
                        id: `att_sol_${attPlaced + 1}`,
                        soldierIndex: attPlaced,
                        side: 'attacker',
                        row: r,
                        col: c,
                        isKing: false,
                        hp: attacker.soldierHps[attPlaced],
                        maxHp: attacker.maxSoldierHp
                    });
                    attPlaced++;
                }
            }
        }

        const attackerSide: 'player' | 'ai' = attacker.side;

        // Set initial turn to attacker (reactive useEffect will handle AI if attackerSide === 'ai')
        setActiveSubBattle({
            attackerGlobalId: attacker.id,
            defenderGlobalId: defender.id,
            attackerSide,
            attackerSquadName: attacker.squadRef.name,
            defenderSquadName: defender.squadRef.name,
            attackerSoldierHps: [...attacker.soldierHps],
            defenderSoldierHps: [...defender.soldierHps],
            tacticalPieces,
            turn: 'attacker',
            selectedTacticalPieceId: null,
            targetGlobalRow: targetRow,
            targetGlobalCol: targetCol,
            logs: [
                `🏟️ Тактичний бій розпочато! Побиту шашку забирають з поля до наступного бою, а її боєць втрачає 1 HP.`,
                `⚔️ Гра за правилами англійських шашок!`
            ]
        });
    };

    // Execute Global Move or Deploy from Retreat Reserve
    const handleGlobalTileClick = (r: number, c: number) => {
        if (turn !== 'player' || gameOver || activeSubBattle || activeCoinBattle) return;

        // Deploy retreated squad if player clicked an empty dark square on Row 7 (index 7, 1st row of player)
        if (selectedRetreatedPieceId && r === 7 && (7 + c) % 2 === 1) {
            const isOccupied = globalSquads.some(s => s.row === 7 && s.col === c);
            if (!isOccupied) {
                const targetRetreated = playerRetreatedSquads.find(s => s.id === selectedRetreatedPieceId);
                if (targetRetreated) {
                    const deployedPiece: GlobalSquadPiece = {
                        ...targetRetreated,
                        row: 7,
                        col: c,
                        isKing: false
                    };

                    const updatedSquads = [...globalSquads, deployedPiece];
                    const updatedRetreated = playerRetreatedSquads.filter(s => s.id !== selectedRetreatedPieceId);

                    setGlobalSquads(updatedSquads);
                    setPlayerRetreatedSquads(updatedRetreated);
                    setSelectedRetreatedPieceId(null);
                    addLog(`🚩 Загін «${targetRetreated.squadRef.name}» повернувся з відступу на 1-шу лінію (ряд 8)!`);

                    // Pass turn to AI (handled reactively by useEffect)
                    setTurn('ai');
                    return;
                }
            }
        }

        const clickedPiece = globalSquads.find(s => s.row === r && s.col === c);

        if (clickedPiece && clickedPiece.side === 'player') {
            setSelectedRetreatedPieceId(null);
            setSelectedGlobalPieceId(clickedPiece.id);
            return;
        }

        if (selectedGlobalPieceId) {
            const activePiece = globalSquads.find(s => s.id === selectedGlobalPieceId);
            if (!activePiece) return;

            const validMoves = getValidGlobalMoves(activePiece, globalSquads);
            const move = validMoves.find(m => m.r === r && m.c === c);

            if (move) {
                if (move.isJump && move.victimId) {
                    const victim = globalSquads.find(s => s.id === move.victimId);
                    if (victim) {
                        if (isCoinBattle) {
                            startCoinBattle(activePiece, victim, r, c, move.isAranianAttack);
                        } else {
                            startSubBattle(activePiece, victim, r, c);
                        }
                        setSelectedGlobalPieceId(null);
                        return;
                    }
                }

                // Normal step on global board
                const newRow = r;
                const newCol = c;
                const isKing = activePiece.isKing || newRow === 0;

                const updatedSquads = globalSquads.map(s => s.id === activePiece.id ? {
                    ...s,
                    row: newRow,
                    col: newCol,
                    isKing
                } : s);

                setGlobalSquads(updatedSquads);
                setSelectedGlobalPieceId(null);
                addLog(`📍 Загін «${activePiece.squadRef.name}» здійснив маневр на (${newRow + 1}, ${newCol + 1}).`);

                // Pass turn to AI (handled reactively by useEffect)
                setTurn('ai');
            }
        }
    };

    // AI Turn Logic on Global Board
    const triggerAiTurn = (
        currentSquads: GlobalSquadPiece[], 
        currentPRetreat: GlobalSquadPiece[] = playerRetreatedSquads, 
        currentAiRetreat: GlobalSquadPiece[] = aiRetreatedSquads
    ) => {
        if (currentSquads.length === 0) return;
        const aiSquadsOnBoard = currentSquads.filter(s => s.side === 'ai');

        if (aiSquadsOnBoard.length === 0 && currentAiRetreat.length === 0) {
            handleVictory(currentSquads, currentPRetreat);
            return;
        }

        // Check if AI should deploy a retreated squad onto Row 0 (1st row of AI)
        if (currentAiRetreat.length > 0) {
            const emptyRow0Cols: number[] = [];
            for (let c = 0; c < 8; c++) {
                if ((0 + c) % 2 === 1 && !currentSquads.some(s => s.row === 0 && s.col === c)) {
                    emptyRow0Cols.push(c);
                }
            }

            if (emptyRow0Cols.length > 0 && (aiSquadsOnBoard.length < 6 || Math.random() < 0.45)) {
                const deployCol = emptyRow0Cols[Math.floor(Math.random() * emptyRow0Cols.length)];
                const aiDeployed = currentAiRetreat[0];

                const deployedPiece: GlobalSquadPiece = {
                    ...aiDeployed,
                    row: 0,
                    col: deployCol,
                    isKing: false
                };

                const updatedSquads = [...currentSquads, deployedPiece];
                const updatedAiRetreat = currentAiRetreat.slice(1);

                setGlobalSquads(updatedSquads);
                setAiRetreatedSquads(updatedAiRetreat);
                addLog(`🤖 Ворожий загін «${aiDeployed.squadRef.name}» повернувся з відступу на свою першу лінію!`);
                setTurn('player');
                return;
            }
        }

        let possibleJumps: { piece: GlobalSquadPiece; move: { r: number; c: number; isJump: boolean; victimId?: string } }[] = [];
        let possibleSteps: { piece: GlobalSquadPiece; move: { r: number; c: number; isJump: boolean; victimId?: string } }[] = [];

        aiSquadsOnBoard.forEach(piece => {
            const moves = getValidGlobalMoves(piece, currentSquads);
            moves.forEach(m => {
                if (m.isJump) possibleJumps.push({ piece, move: m });
                else possibleSteps.push({ piece, move: m });
            });
        });

        if (possibleJumps.length > 0) {
            const choice = possibleJumps[Math.floor(Math.random() * possibleJumps.length)];
            const victim = currentSquads.find(s => s.id === choice.move.victimId);
            if (victim) {
                if (isCoinBattle) {
                    startCoinBattle(choice.piece, victim, choice.move.r, choice.move.c, (choice.move as any).isAranianAttack);
                } else {
                    startSubBattle(choice.piece, victim, choice.move.r, choice.move.c);
                }
                return;
            }
        } else if (possibleSteps.length > 0) {
            const choice = possibleSteps[Math.floor(Math.random() * possibleSteps.length)];
            const isKing = choice.piece.isKing || choice.move.r === 7;

            const updated = currentSquads.map(s => s.id === choice.piece.id ? {
                ...s,
                row: choice.move.r,
                col: choice.move.c,
                isKing
            } : s);

            setGlobalSquads(updated);
            addLog(`🤖 Ворожий загін «${choice.piece.squadRef.name}» перемістився на (${choice.move.r + 1}, ${choice.move.c + 1}).`);
            setTurn('player');
        } else {
            const pUnitsCount = currentSquads.filter(s => s.side === 'player').length + currentPRetreat.length;
            if (pUnitsCount > 0) {
                handleVictory(currentSquads, currentPRetreat);
            } else {
                handleDefeat(currentSquads);
            }
        }
    };

    // -------------------------------------------------------------------
    // TACTICAL SUB-BATTLE INTERACTIVE LOGIC & MOVES
    // -------------------------------------------------------------------

    // Helper: Calculate valid moves for a soldier checker on tactical board
    const getValidTacticalMoves = (piece: TacticalSoldierPiece, pieces: TacticalSoldierPiece[]) => {
        const moves: { r: number; c: number; isJump: boolean; victimId?: string }[] = [];
        const dirForward = piece.side === 'attacker' ? -1 : 1;
        const dirs = piece.isKing 
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] 
            : [[dirForward, -1], [dirForward, 1]];

        dirs.forEach(([dr, dc]) => {
            const nr = piece.row + dr;
            const nc = piece.col + dc;

            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const target = pieces.find(p => p.row === nr && p.col === nc && p.hp > 0);
                if (!target) {
                    moves.push({ r: nr, c: nc, isJump: false });
                } else if (target.side !== piece.side) {
                    // Jump attempt over enemy
                    const jnr = nr + dr;
                    const jnc = nc + dc;
                    if (jnr >= 0 && jnr < 8 && jnc >= 0 && jnc < 8) {
                        const jumpTarget = pieces.find(p => p.row === jnr && p.col === jnc && p.hp > 0);
                        if (!jumpTarget) {
                            moves.push({ r: jnr, c: jnc, isJump: true, victimId: target.id });
                        }
                    }
                }
            }
        });

        // Check if ANY piece of this side has jumps available (mandatory jump rule in checkers)
        const jumpsOnly = moves.filter(m => m.isJump);
        if (jumpsOnly.length > 0) return jumpsOnly;

        return moves;
    };

    // Tactical AI turn execution
    const triggerTacticalAiTurn = (subBattleObj?: typeof activeSubBattle) => {
        const currentSub = subBattleObj || activeSubBattle;
        if (!currentSub) return;

        const aiSide: 'attacker' | 'defender' = currentSub.attackerSide === 'player' ? 'defender' : 'attacker';
        if (currentSub.turn !== aiSide) return;

        const currentPieces = currentSub.tacticalPieces;
        const livingAi = currentPieces.filter(p => p.side === aiSide);

        if (livingAi.length === 0) {
            finishSubBattle(
                aiSide === 'attacker' ? 'defender' : 'attacker',
                currentSub.attackerSoldierHps,
                currentSub.defenderSoldierHps,
                currentSub
            );
            return;
        }

        let allJumps: { piece: TacticalSoldierPiece; move: { r: number; c: number; isJump: boolean; victimId?: string } }[] = [];
        let allSteps: { piece: TacticalSoldierPiece; move: { r: number; c: number; isJump: boolean; victimId?: string } }[] = [];

        livingAi.forEach(piece => {
            const mList = getValidTacticalMoves(piece, currentPieces);
            mList.forEach(m => {
                if (m.isJump) allJumps.push({ piece, move: m });
                else allSteps.push({ piece, move: m });
            });
        });

        let attHps = [...currentSub.attackerSoldierHps];
        let defHps = [...currentSub.defenderSoldierHps];

        if (allJumps.length > 0) {
            const choice = allJumps[Math.floor(Math.random() * allJumps.length)];
            const victim = currentPieces.find(p => p.id === choice.move.victimId);

            if (victim) {
                if (victim.side === 'attacker') {
                    attHps[victim.soldierIndex] = Math.max(0, attHps[victim.soldierIndex] - 1);
                } else {
                    defHps[victim.soldierIndex] = Math.max(0, defHps[victim.soldierIndex] - 1);
                }
            }

            // REMOVE beaten victim checker from tactical board
            let updated = currentPieces
                .filter(p => !victim || p.id !== victim.id)
                .map(p => {
                    if (p.id === choice.piece.id) {
                        return {
                            ...p,
                            row: choice.move.r,
                            col: choice.move.c,
                            isKing: p.isKing || (p.side === 'attacker' ? choice.move.r === 0 : choice.move.r === 7)
                        };
                    }
                    return p;
                });

            const attAlive = updated.filter(p => p.side === 'attacker');
            const defAlive = updated.filter(p => p.side === 'defender');

            if (attAlive.length === 0) {
                finishSubBattle('defender', attHps, defHps, currentSub);
                return;
            }
            if (defAlive.length === 0) {
                finishSubBattle('attacker', attHps, defHps, currentSub);
                return;
            }

            // Check for multi-jump
            const movedPieceUpdated = updated.find(p => p.id === choice.piece.id);
            const additionalJumps = (choice.move.isJump && movedPieceUpdated)
                ? getValidTacticalMoves(movedPieceUpdated, updated).filter(m => m.isJump)
                : [];

            if (additionalJumps.length > 0) {
                // Stay on AI turn for multi-jump
                setActiveSubBattle(prev => prev ? {
                    ...prev,
                    attackerSoldierHps: attHps,
                    defenderSoldierHps: defHps,
                    tacticalPieces: updated,
                    turn: aiSide,
                    selectedTacticalPieceId: null,
                    logs: [`⚔️ Ворожий боєць здійснив серійне збиття! (-1 HP).`, ...prev.logs]
                } : null);
            } else {
                const nextTurn = aiSide === 'attacker' ? 'defender' : 'attacker';
                setActiveSubBattle(prev => prev ? {
                    ...prev,
                    attackerSoldierHps: attHps,
                    defenderSoldierHps: defHps,
                    tacticalPieces: updated,
                    turn: nextTurn,
                    selectedTacticalPieceId: null,
                    logs: [`⚔️ Ворожий боєць збив вашого солдата! Його знято з поля (-1 HP).`, ...prev.logs]
                } : null);
            }

        } else if (allSteps.length > 0) {
            const choice = allSteps[Math.floor(Math.random() * allSteps.length)];
            let updated = currentPieces.map(p => {
                if (p.id === choice.piece.id) {
                    return {
                        ...p,
                        row: choice.move.r,
                        col: choice.move.c,
                        isKing: p.isKing || (p.side === 'attacker' ? choice.move.r === 0 : choice.move.r === 7)
                    };
                }
                return p;
            });

            const nextTurn = aiSide === 'attacker' ? 'defender' : 'attacker';
            setActiveSubBattle(prev => prev ? {
                ...prev,
                tacticalPieces: updated,
                turn: nextTurn,
                selectedTacticalPieceId: null,
                logs: [`🤖 Ворожа шашка-солдат перемістилася.`, ...prev.logs]
            } : null);
        } else {
            const victor = aiSide === 'attacker' ? 'defender' : 'attacker';
            finishSubBattle(victor, attHps, defHps, currentSub);
        }
    };

    // Player clicks a tile on the tactical sub-battle board
    const handleTacticalTileClick = (r: number, c: number) => {
        if (!activeSubBattle) return;

        // Player controls 'attacker' if attackerSide === 'player', else 'defender'
        const playerTacticalSide: 'attacker' | 'defender' = activeSubBattle.attackerSide === 'player' ? 'attacker' : 'defender';

        if (activeSubBattle.turn !== playerTacticalSide) return; // Not player's turn

        const clickedPiece = activeSubBattle.tacticalPieces.find(p => p.row === r && p.col === c);

        // Clicked own living piece -> Select it
        if (clickedPiece && clickedPiece.side === playerTacticalSide) {
            setActiveSubBattle({
                ...activeSubBattle,
                selectedTacticalPieceId: clickedPiece.id
            });
            return;
        }

        // If piece is selected, check valid move target
        if (activeSubBattle.selectedTacticalPieceId) {
            const activePiece = activeSubBattle.tacticalPieces.find(p => p.id === activeSubBattle.selectedTacticalPieceId);
            if (!activePiece) return;

            const validMoves = getValidTacticalMoves(activePiece, activeSubBattle.tacticalPieces);
            const move = validMoves.find(m => m.r === r && m.c === c);

            if (move) {
                let victim = move.isJump ? activeSubBattle.tacticalPieces.find(p => p.id === move.victimId) : null;

                let attHps = [...activeSubBattle.attackerSoldierHps];
                let defHps = [...activeSubBattle.defenderSoldierHps];

                if (victim) {
                    if (victim.side === 'attacker') {
                        attHps[victim.soldierIndex] = Math.max(0, attHps[victim.soldierIndex] - 1);
                    } else {
                        defHps[victim.soldierIndex] = Math.max(0, defHps[victim.soldierIndex] - 1);
                    }
                }

                // REMOVE beaten victim checker from tactical board
                let updatedPieces = activeSubBattle.tacticalPieces
                    .filter(p => !victim || p.id !== victim.id)
                    .map(p => {
                        if (p.id === activePiece.id) {
                            return {
                                ...p,
                                row: r,
                                col: c,
                                isKing: p.isKing || (p.side === 'attacker' ? r === 0 : r === 7)
                            };
                        }
                        return p;
                    });

                const attAlive = updatedPieces.filter(p => p.side === 'attacker');
                const defAlive = updatedPieces.filter(p => p.side === 'defender');

                if (attAlive.length === 0) {
                    finishSubBattle('defender', attHps, defHps);
                    return;
                }
                if (defAlive.length === 0) {
                    finishSubBattle('attacker', attHps, defHps);
                    return;
                }

                // Check for multi-jump
                const movedPieceUpdated = updatedPieces.find(p => p.id === activePiece.id)!;
                const additionalJumps = move.isJump 
                    ? getValidTacticalMoves(movedPieceUpdated, updatedPieces).filter(m => m.isJump)
                    : [];

                if (additionalJumps.length > 0) {
                    // Stay on player's turn for multi-jump
                    setActiveSubBattle({
                        ...activeSubBattle,
                        attackerSoldierHps: attHps,
                        defenderSoldierHps: defHps,
                        tacticalPieces: updatedPieces,
                        turn: playerTacticalSide,
                        selectedTacticalPieceId: activePiece.id,
                        logs: [
                            `⚔️ Серійне збиття! Шашку збито та знято з поля. Здійсніть наступне збиття!`,
                            ...activeSubBattle.logs
                        ]
                    });
                } else {
                    const aiSide: 'attacker' | 'defender' = playerTacticalSide === 'attacker' ? 'defender' : 'attacker';
                    
                    setActiveSubBattle({
                        ...activeSubBattle,
                        attackerSoldierHps: attHps,
                        defenderSoldierHps: defHps,
                        tacticalPieces: updatedPieces,
                        turn: aiSide,
                        selectedTacticalPieceId: null,
                        logs: [
                            move.isJump ? `⚔️ Точний удар! Шашку збито та знято з поля (-1 HP бійця).` : `📍 Ваша шашка-солдат перемістилася.`,
                            ...activeSubBattle.logs
                        ]
                    });
                    // Reactive useEffect will trigger AI turn automatically
                }
            } else {
                // Clicked an invalid tile -> Deselect
                setActiveSubBattle({
                    ...activeSubBattle,
                    selectedTacticalPieceId: null
                });
            }
        }
    };

    // Finish Sub-Battle and apply results
    const finishSubBattle = (
        victor: 'attacker' | 'defender', 
        attHps: number[], 
        defHps: number[],
        subBattleObj?: typeof activeSubBattle
    ) => {
        const currentSub = subBattleObj || activeSubBattle;
        if (!currentSub) return;

        const { attackerGlobalId, defenderGlobalId, targetGlobalRow, targetGlobalCol } = currentSub;
        const attacker = globalSquads.find(s => s.id === attackerGlobalId);
        const defender = globalSquads.find(s => s.id === defenderGlobalId);

        if (!attacker || !defender) {
            setActiveSubBattle(null);
            return;
        }

        // Filter out fallen soldiers (0 HP)
        const attRemainingHps = attHps.filter(hp => hp > 0);
        const defRemainingHps = defHps.filter(hp => hp > 0);

        let newGlobalSquadsList = [...globalSquads];
        let newPlayerRetreat = [...playerRetreatedSquads];
        let newAiRetreat = [...aiRetreatedSquads];

        if (victor === 'attacker') {
            addLog(`⚔️ ТАКТИЧНА ПЕРЕМОГА! Загін «${attacker.squadRef.name}» здолав ворожий загін і зайняв його позицію!`);

            const { updatedSquad, leveledUp } = applySquadExpAndLevelUp(attacker.squadRef, 3);
            if (leveledUp) {
                playLevelUpSound();
                addLog(`✨ ЗАГІН ЗДОБУВ РІВЕНЬ! Загін «${attacker.squadRef.name}» підвищив рівень до ${updatedSquad.level}! Всі вцілілі бійці відновили +1 HP!`);
            } else {
                addLog(`⭐ Загін «${attacker.squadRef.name}» здобув +3 досвіду за перемогу у тактичному бою!`);
            }

            const updatedAttackerRef: ToySoldier = {
                ...updatedSquad,
                soldiersCount: attRemainingHps.length,
                soldierHps: attRemainingHps
            };

            const isDefenderFullyDestroyed = defRemainingHps.length === 0;
            const finalDefHps = isDefenderFullyDestroyed ? [1] : defRemainingHps;
            const updatedDefenderRef: ToySoldier = {
                ...defender.squadRef,
                soldiersCount: finalDefHps.length,
                soldierHps: finalDefHps,
                deaths: isDefenderFullyDestroyed ? (defender.squadRef.deaths || 0) + 1 : (defender.squadRef.deaths || 0)
            };

            const retreatedDefender: GlobalSquadPiece = {
                ...defender,
                soldierHps: finalDefHps,
                squadRef: updatedDefenderRef
            };
            if (defender.side === 'player') {
                newPlayerRetreat.push(retreatedDefender);
            } else {
                newAiRetreat.push(retreatedDefender);
            }

            if (isDefenderFullyDestroyed) {
                addLog(`💀 Загін «${defender.squadRef.name}» був розбитий, втратив прапор і відступив у резерв (+1 смерть, всього: ${updatedDefenderRef.deaths}/3)!`);
            } else {
                addLog(`🛡️ Загін «${defender.squadRef.name}» зазнав поразки і відступив у резерв!`);
            }

            newGlobalSquadsList = newGlobalSquadsList
                .filter(s => s.id !== defenderGlobalId)
                .map(s => s.id === attackerGlobalId ? {
                    ...s,
                    row: targetGlobalRow,
                    col: targetGlobalCol,
                    isKing: s.isKing || targetGlobalRow === (s.side === 'player' ? 0 : 7),
                    soldierHps: attRemainingHps,
                    squadRef: updatedAttackerRef
                } : s);

        } else {
            addLog(`🛡️ ТАКТИЧНА ПОРАЗКА! Атаку загону «${attacker.squadRef.name}» було відбито!`);

            const { updatedSquad, leveledUp } = applySquadExpAndLevelUp(defender.squadRef, 3);
            if (leveledUp) {
                playLevelUpSound();
                addLog(`✨ ЗАГІН ЗДОБУВ РІВЕНЬ! Загін «${defender.squadRef.name}» підвищив рівень до ${updatedSquad.level}! Всі вцілілі бійці відновили +1 HP!`);
            } else {
                addLog(`⭐ Загін «${defender.squadRef.name}» здобув +3 досвіду за успішну оборону!`);
            }

            const updatedDefenderRef: ToySoldier = {
                ...updatedSquad,
                soldiersCount: defRemainingHps.length,
                soldierHps: defRemainingHps
            };

            const isAttackerFullyDestroyed = attRemainingHps.length === 0;
            const finalAttHps = isAttackerFullyDestroyed ? [1] : attRemainingHps;
            const updatedAttackerRef: ToySoldier = {
                ...attacker.squadRef,
                soldiersCount: finalAttHps.length,
                soldierHps: finalAttHps,
                deaths: isAttackerFullyDestroyed ? (attacker.squadRef.deaths || 0) + 1 : (attacker.squadRef.deaths || 0)
            };

            const retreatedAttacker: GlobalSquadPiece = {
                ...attacker,
                soldierHps: finalAttHps,
                squadRef: updatedAttackerRef
            };
            if (attacker.side === 'player') {
                newPlayerRetreat.push(retreatedAttacker);
            } else {
                newAiRetreat.push(retreatedAttacker);
            }

            if (isAttackerFullyDestroyed) {
                addLog(`💀 Атакуючий загін «${attacker.squadRef.name}» був розбитий і відступив у резерв (+1 смерть, всього: ${updatedAttackerRef.deaths}/3)!`);
            } else {
                addLog(`⚔️ Загін нападника «${attacker.squadRef.name}» відступив у резерв!`);
            }

            newGlobalSquadsList = newGlobalSquadsList
                .filter(s => s.id !== attackerGlobalId)
                .map(s => s.id === defenderGlobalId ? {
                    ...s,
                    soldierHps: defRemainingHps,
                    squadRef: updatedDefenderRef
                } : s);
        }

        setGlobalSquads(newGlobalSquadsList);
        setPlayerRetreatedSquads(newPlayerRetreat);
        setAiRetreatedSquads(newAiRetreat);
        setActiveSubBattle(null);

        const remainingPlayerCount = newGlobalSquadsList.filter(s => s.side === 'player').length + newPlayerRetreat.length;
        const remainingAiCount = newGlobalSquadsList.filter(s => s.side === 'ai').length + newAiRetreat.length;

        if (remainingAiCount === 0) {
            handleVictory(newGlobalSquadsList, newPlayerRetreat);
        } else if (remainingPlayerCount === 0) {
            handleDefeat(newGlobalSquadsList, newPlayerRetreat);
        } else {
            const nextTurn = turn === 'player' ? 'ai' : 'player';
            setTurn(nextTurn);
        }
    };

    // Auto-resolve Sub-Battle button action
    const handleAutoResolveSubBattle = () => {
        if (!activeSubBattle) return;

        let pieces = [...activeSubBattle.tacticalPieces];
        let attHps = [...activeSubBattle.attackerSoldierHps];
        let defHps = [...activeSubBattle.defenderSoldierHps];
        let currentTurn = activeSubBattle.turn;

        for (let round = 0; round < 40; round++) {
            const atts = pieces.filter(p => p.side === 'attacker');
            const defs = pieces.filter(p => p.side === 'defender');

            if (atts.length === 0 || defs.length === 0) break;

            if (currentTurn === 'attacker') {
                const victim = defs[Math.floor(Math.random() * defs.length)];
                defHps[victim.soldierIndex] = Math.max(0, defHps[victim.soldierIndex] - 1);
                pieces = pieces.filter(p => p.id !== victim.id);
                currentTurn = 'defender';
            } else {
                const victim = atts[Math.floor(Math.random() * atts.length)];
                attHps[victim.soldierIndex] = Math.max(0, attHps[victim.soldierIndex] - 1);
                pieces = pieces.filter(p => p.id !== victim.id);
                currentTurn = 'attacker';
            }
        }

        const remainingAtts = pieces.filter(p => p.side === 'attacker');
        const remainingDefs = pieces.filter(p => p.side === 'defender');

        const victor = remainingAtts.length >= remainingDefs.length ? 'attacker' : 'defender';
        finishSubBattle(victor, attHps, defHps);
    };

    // Instant Player Victory for Tactical Sub-Battle (Test button for quick testing - opponent squad disappears)
    const handleInstantPlayerVictorySubBattle = () => {
        if (!activeSubBattle) return;

        const isPlayerAttacker = activeSubBattle.attackerSide === 'player';

        if (isPlayerAttacker) {
            // Player is attacker: Player wins with current remaining player soldier HPs; AI defender gets 0 living soldiers (completely destroyed)
            const playerHps = activeSubBattle.attackerSoldierHps;
            const aiHps = activeSubBattle.defenderSoldierHps.map(() => 0);
            finishSubBattle('attacker', playerHps, aiHps);
        } else {
            // AI is attacker, Player is defender: Player wins with current remaining player soldier HPs; AI attacker gets 0 living soldiers (completely destroyed)
            const aiHps = activeSubBattle.attackerSoldierHps.map(() => 0);
            const playerHps = activeSubBattle.defenderSoldierHps;
            finishSubBattle('defender', aiHps, playerHps);
        }
    };

    // Handle Overall Victory
    const handleVictory = (currentSquads = globalSquads, currentPRetreat = playerRetreatedSquads) => {
        setGameOver('victory');
        playGoldSound();
        const goldReward = 120 + opponent.rank * 30;

        const currentProg = progressRef.current;
        const deployedIds = deployedPlayerSquadIdsRef.current;

        const playerSquadsActive = [
            ...currentSquads.filter(s => s.side === 'player'),
            ...currentPRetreat.filter(s => s.side === 'player')
        ];

        // Award +5 EXP to ALL surviving player squads for winning the global match!
        const survivingPlayerMap = new Map<string, ToySoldier>();
        let leveledUpAny = false;

        playerSquadsActive.forEach(pPiece => {
            const { updatedSquad, leveledUp } = applySquadExpAndLevelUp(pPiece.squadRef, 5);
            if (leveledUp) leveledUpAny = true;

            const finalSquadRef: ToySoldier = {
                ...updatedSquad,
                soldiersCount: pPiece.soldierHps.length,
                soldierHps: [...pPiece.soldierHps]
            };
            survivingPlayerMap.set(String(pPiece.squadRef.id), finalSquadRef);
        });

        if (leveledUpAny) {
            playLevelUpSound();
        }

        addLog(`⭐ Всі вцілілі загони отримали +5 досвіду за перемогу у глобальній партії!`);

        const currentCollection = currentProg.toySoldiers || [];

        const updatedCollection = currentCollection.map(s => {
            if (s.isCheckersSquad || s.type === 'шашка_загін') {
                const idStr = String(s.id);
                if (deployedIds.has(idStr)) {
                    if (survivingPlayerMap.has(idStr)) {
                        return survivingPlayerMap.get(idStr)!;
                    }
                    // Destroyed in global match -> Permanently removed
                    return null;
                }
                // Not deployed in this match -> Keep untouched in collection
                return s;
            }
            return s;
        }).filter((s): s is ToySoldier => s !== null);

        const updatedProgress: WorldProgress = {
            ...currentProg,
            playerGold: currentProg.playerGold + goldReward,
            toySoldiers: updatedCollection
        };

        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        onVictory(updatedProgress);
    };

    // Handle Overall Defeat
    const handleDefeat = (currentSquads = globalSquads, currentPRetreat = playerRetreatedSquads) => {
        setGameOver('defeat');

        const currentProg = progressRef.current;
        const deployedIds = deployedPlayerSquadIdsRef.current;

        const playerSquadsActive = [
            ...currentSquads.filter(s => s.side === 'player'),
            ...currentPRetreat.filter(s => s.side === 'player')
        ];

        const survivingPlayerMap = new Map<string, ToySoldier>();

        playerSquadsActive.forEach(pPiece => {
            const finalSquadRef: ToySoldier = {
                ...pPiece.squadRef,
                soldiersCount: pPiece.soldierHps.length,
                soldierHps: [...pPiece.soldierHps]
            };
            survivingPlayerMap.set(String(pPiece.squadRef.id), finalSquadRef);
        });

        const currentCollection = currentProg.toySoldiers || [];

        const updatedCollection = currentCollection.map(s => {
            if (s.isCheckersSquad || s.type === 'шашка_загін') {
                const idStr = String(s.id);
                if (deployedIds.has(idStr)) {
                    if (survivingPlayerMap.has(idStr)) {
                        return survivingPlayerMap.get(idStr)!;
                    }
                    // Destroyed in match -> Permanently removed
                    return null;
                }
                // Not deployed in this match -> Keep untouched in collection
                return s;
            }
            return s;
        }).filter((s): s is ToySoldier => s !== null);

        const updatedProgress: WorldProgress = {
            ...currentProg,
            toySoldiers: updatedCollection
        };

        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        onDefeat(updatedProgress);
    };

    const selectedPiece = globalSquads.find(s => s.id === selectedGlobalPieceId);
    const validMoves = selectedPiece ? getValidGlobalMoves(selectedPiece, globalSquads) : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden select-none">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-5xl bg-[#1a0f14] border-2 border-red-500/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7] max-h-[95vh] h-full"
            >
                {/* Header */}
                <div className="bg-[#241318] border-b border-red-500/40 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl p-1.5 rounded-xl bg-red-950/80 border border-red-500/50">
                            {variant === 'aranian_military_checkers' ? '👑🪙' : variant === 'military_checkers' ? '🪙🛡️' : variant === 'aranian_checkers_war' ? '⚔️👑' : '⚔️🔴'}
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black font-serif text-red-200 flex items-center gap-2">
                                <span>
                                    {variant === 'aranian_military_checkers' 
                                        ? 'Аранійські військові шашки (120 бійців)' 
                                        : variant === 'military_checkers' 
                                        ? 'Військові шашки (120 бійців)' 
                                        : variant === 'aranian_checkers_war' 
                                        ? 'Аранійські армійські шашки 8х8' 
                                        : 'Армійські шашки (8х8)'}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300">
                                    Таверна: {tavernName}
                                </span>
                            </h2>
                            <p className="text-xs text-stone-400">
                                {variant === 'aranian_military_checkers'
                                    ? 'Аранійські ходи (вліво, вправо, вперед, діагоналі; дамка 8 напрямків; взяття на клітинку побитого) + масштабна битва монет 120 бійців!'
                                    : variant === 'military_checkers'
                                    ? 'Класичні шашкові ходи + битва монет 120 бійців: N vs M кидків, втрати N - M!'
                                    : variant === 'aranian_checkers_war'
                                    ? 'Аранійські ходи на глобальній дошці (вліво, вправо, вперед, діагоналі) + тактична 8х8 битва загонів!'
                                    : 'Двобій 12 армійських шашок-загонів на 8х8 дошці. Атака запускає тактичний бій на англійських шашках!'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-black/40 rounded-xl border border-stone-800 text-xs font-mono">
                            <span className="text-stone-400">Хід: </span>
                            <span className={turn === 'player' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                {turn === 'player' ? 'ВАШ ХІД (Гравець)' : `ХІД СУПЕРНИКА (${opponent.name})`}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto max-h-[78vh]">
                    {/* Left Panel: Global 8x8 Board */}
                    <div className="lg:col-span-8 flex flex-col items-center justify-center bg-[#120a0e] p-3 rounded-2xl border border-stone-800 self-start shrink-0">
                        <div className="mb-2 w-full flex items-center justify-between text-xs font-bold px-2">
                            <div className="flex items-center gap-2 text-rose-300">
                                <span className="text-lg">⚫</span>
                                <span>Загони {opponent.name}: {globalSquads.filter(s => s.side === 'ai').length}/12</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-300">
                                <span>Ваші Загони: {globalSquads.filter(s => s.side === 'player').length}/12</span>
                                <span className="text-lg">🔴</span>
                            </div>
                        </div>

                        {/* Global 8x8 Board Grid */}
                        <div className="grid grid-cols-8 grid-rows-8 gap-0.5 border-4 border-amber-950 rounded-xl overflow-hidden shadow-2xl bg-[#0f090d] w-full max-w-[460px] aspect-square shrink-0 select-none">
                            {Array.from({ length: 64 }).map((_, idx) => {
                                const r = Math.floor(idx / 8);
                                const c = idx % 8;
                                const isDark = (r + c) % 2 === 1;
                                const squad = globalSquads.find(s => s.row === r && s.col === c);
                                const isSelected = squad && squad.id === selectedGlobalPieceId;
                                const isValidMove = validMoves.some(m => m.r === r && m.c === c);
                                const moveDetail = validMoves.find(m => m.r === r && m.c === c);
                                const isDeployTarget = !!(selectedRetreatedPieceId && r === 7 && isDark && !squad);

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleGlobalTileClick(r, c)}
                                        className={`relative flex items-center justify-center transition-all ${
                                            isDark 
                                                ? 'bg-[#3b2520] hover:bg-[#4a2e28]' 
                                                : 'bg-[#d8c2a8]'
                                        } ${isSelected ? 'ring-4 ring-yellow-400 z-10' : ''} ${
                                            isValidMove || isDeployTarget ? 'cursor-pointer' : ''
                                        }`}
                                    >
                                        {/* Tile Coordinates overlay on dark squares */}
                                        {isDark && (
                                            <span className="absolute top-0.5 left-0.5 text-[8px] text-amber-200/20 font-mono select-none">
                                                {r + 1},{c + 1}
                                            </span>
                                        )}

                                        {/* Highlight deployment target for retreated squad */}
                                        {isDeployTarget && (
                                            <div className="absolute inset-1 rounded-full border-2 border-emerald-400 bg-emerald-600/50 animate-pulse flex items-center justify-center z-10 shadow-lg">
                                                <span className="text-white font-black text-xs">🚩</span>
                                            </div>
                                        )}

                                        {/* Highlight valid destination or jump target */}
                                        {isValidMove && (
                                            <div className={`absolute inset-1 rounded-full border-2 animate-pulse flex items-center justify-center ${
                                                moveDetail?.isJump 
                                                    ? 'bg-rose-600/50 border-rose-400' 
                                                    : 'bg-emerald-500/40 border-emerald-300'
                                            }`}>
                                                <span className="text-white font-black text-xs">
                                                    {moveDetail?.isJump ? '⚔️' : '•'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Render Squad Piece */}
                                        {squad && (
                                            <motion.div
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                className={`relative w-[85%] h-[85%] rounded-full border-2 shadow-lg flex flex-col items-center justify-center cursor-pointer select-none transition-transform ${
                                                    squad.side === 'player'
                                                        ? 'bg-gradient-to-b from-red-600 to-rose-900 border-amber-300 shadow-red-950/80'
                                                        : 'bg-gradient-to-b from-stone-800 to-black border-stone-500 shadow-black'
                                                }`}
                                            >
                                                {squad.isKing && (
                                                    <Crown className="w-3 h-3 text-yellow-300 absolute -top-1 text-center" />
                                                )}

                                                <span className="text-sm sm:text-base leading-none">
                                                    {squad.side === 'player' ? '🔴' : '⚫'}
                                                </span>

                                                <span className="px-1 bg-black/80 rounded text-[9px] font-mono font-bold text-amber-200 mt-0.5 border border-stone-800">
                                                    {squad.soldierHps.length} бійц.
                                                </span>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Panel: Squad Details & Battle Logs */}
                    <div className="lg:col-span-4 flex flex-col gap-3">
                        {/* Selected Squad Info */}
                        <div className="bg-[#1e1319] p-3 rounded-2xl border border-stone-800 space-y-2">
                            <h3 className="text-xs font-bold text-amber-200 flex items-center gap-1.5 border-b border-stone-800 pb-1.5">
                                <Users className="w-4 h-4 text-amber-400" />
                                <span>Інформація про Обраний Загін</span>
                            </h3>

                            {selectedPiece ? (
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-amber-300">{selectedPiece.squadRef.name}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-500/50 text-[10px] text-purple-200 font-bold">
                                            Рівень {selectedPiece.squadRef.level || 0}★
                                        </span>
                                    </div>

                                    <div className="bg-black/40 p-2 rounded-xl border border-stone-800/80 space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-stone-400">Живих бійців:</span>
                                            <span className="text-emerald-400">
                                                {selectedPiece.soldierHps.length} {isCoinBattle ? '/ 120 бійців' : 'шашок'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-stone-400">Досвід загону (XP):</span>
                                            <span className="text-amber-300">{selectedPiece.squadRef.experience || 0} XP</span>
                                        </div>
                                        {isCoinBattle ? (
                                            <div className="text-[10px] text-amber-300/90 font-medium pt-0.5">
                                                {getMilitarySquadPerkLabel(selectedPiece.squadRef.level || 0)}
                                            </div>
                                        ) : (
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-stone-400">HP бійців:</span>
                                                <span className="text-rose-400 font-mono">{selectedPiece.soldierHps.join(', ')} (макс {selectedPiece.maxSoldierHp})</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Replenish button for damaged player squad */}
                                    {selectedPiece.side === 'player' && selectedPiece.soldierHps.length < (isCoinBattle ? 120 : (selectedPiece.squadRef.maxSoldiers || 12)) && (
                                        <button
                                            onClick={handleReplenishSelectedSquad}
                                            className="w-full py-1.5 px-2 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-600 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 shadow-md cursor-pointer transition"
                                        >
                                            <Coins className="w-3.5 h-3.5" />
                                            <span>
                                                Відновити загін ({isCoinBattle ? `${Math.ceil((120 - selectedPiece.soldierHps.length) / 2)} з.` : '40 з.'})
                                            </span>
                                        </button>
                                    )}

                                    <p className="text-[10px] text-stone-400">
                                        {isCoinBattle 
                                            ? 'Клацніть на клітинку з ⚔️, щоб почати битву монет (120 бійців, N vs M)!' 
                                            : 'Клацніть на підсвічену клітинку зі знаком ⚔️, щоб розпочати тактичну битву на 8х8 дошці!'}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-stone-500 italic py-2">
                                    Оберіть свою шашку-загін на дошці для здійснення маневру або загін у відступі для повернення.
                                </p>
                            )}
                        </div>

                        {/* Retreated Squads Reserve Panel */}
                        <div className="bg-[#1e1319] p-3 rounded-2xl border border-stone-800 space-y-2">
                            <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                                <h3 className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                                    <RefreshCw className="w-4 h-4 text-amber-400" />
                                    <span>Загони у Відступі (Резерв)</span>
                                </h3>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-amber-300">
                                    {playerRetreatedSquads.length} в резерві
                                </span>
                            </div>

                            {playerRetreatedSquads.length > 0 ? (
                                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-800">
                                    {playerRetreatedSquads.map(sq => {
                                        const isSelected = sq.id === selectedRetreatedPieceId;
                                        return (
                                            <div
                                                key={sq.id}
                                                className={`p-2 rounded-xl border transition flex items-center justify-between gap-2 ${
                                                    isSelected 
                                                        ? 'bg-amber-950/80 border-amber-400 ring-2 ring-yellow-400' 
                                                        : 'bg-black/40 border-stone-800 hover:border-stone-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="text-base">{sq.squadRef.avatar || '🔴'}</span>
                                                    <div className="truncate">
                                                        <div className="text-[11px] font-bold text-amber-200 truncate">
                                                            {sq.squadRef.name}
                                                        </div>
                                                        <div className="text-[9px] text-stone-400 font-mono">
                                                            {sq.soldierHps.length} бійців • Lvl {sq.squadRef.level || 0}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setSelectedGlobalPieceId(null);
                                                        setSelectedRetreatedPieceId(isSelected ? null : sq.id);
                                                    }}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer shrink-0 ${
                                                        isSelected
                                                            ? 'bg-amber-500 text-stone-950 border-amber-300 animate-pulse'
                                                            : 'bg-stone-900 border-stone-700 text-amber-200 hover:bg-stone-800'
                                                    }`}
                                                >
                                                    {isSelected ? '1-й ряд 🚩' : 'Виставити 🚩'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-[10px] text-stone-500 italic py-1">
                                    Порожньо. Побиті загони потрапляють у відступ і можуть бути виставлені на 1-шу лінію замість ходу.
                                </p>
                            )}
                        </div>

                        {/* Battle Log Box */}
                        <div className="bg-[#130b0f] p-3 rounded-2xl border border-stone-800/80 flex-1 flex flex-col max-h-[280px]">
                            <h4 className="text-xs font-bold text-amber-200 mb-2 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-amber-400" />
                                <span>Журнал Бойових Дій</span>
                            </h4>

                            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[10px] pr-1 scrollbar-thin scrollbar-thumb-stone-800">
                                {battleLogs.map((log, idx) => (
                                    <div key={idx} className="p-1 rounded bg-black/30 border border-stone-800/40 text-stone-300 leading-tight">
                                        {log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Sub-Battle Overlay Modal (rendered as top-level popup so the chessboard NEVER moves or jumps) */}
            <AnimatePresence>
                {activeSubBattle && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md p-3 sm:p-5 flex flex-col items-center justify-center overflow-y-auto select-none pointer-events-auto"
                    >
                        <div className="w-full max-w-3xl bg-[#1e1117] border-2 border-red-500 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
                                {/* Sub-Battle Header */}
                                <div className="flex items-center justify-between border-b border-red-500/40 pb-2">
                                    <div className="flex items-center gap-2">
                                        <Swords className="w-5 h-5 text-red-400 animate-pulse" />
                                        <h3 className="text-base font-black text-amber-200">
                                            Тактичний Бій Загонів (Англійські Шашки 8х8)
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleInstantPlayerVictorySubBattle}
                                            className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer flex items-center gap-1 border border-emerald-400/50"
                                            title="Тестова автоперемога: вороговий загін знищується і зникає з карти"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                                            <span>⚡ Автоперемога (Тест)</span>
                                        </button>
                                        <button
                                            onClick={handleAutoResolveSubBattle}
                                            className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition cursor-pointer flex items-center gap-1"
                                        >
                                            <Zap className="w-3.5 h-3.5 text-yellow-300" />
                                            <span>Швидкий Авто-Бій</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between text-xs font-bold">
                                    <span className="px-2.5 py-1 rounded-lg bg-red-950 border border-red-600 text-red-200 flex items-center gap-1.5">
                                        <span>🔴 Атака: {activeSubBattle.attackerSquadName}</span>
                                        <span className="px-1.5 py-0.2 bg-black/60 rounded text-emerald-400">
                                            {activeSubBattle.tacticalPieces.filter(p => p.side === 'attacker').length} шашок
                                        </span>
                                    </span>

                                    <span className="text-amber-400 font-mono">
                                        Хід: {activeSubBattle.turn === 'attacker' ? '🔴 АТАКА' : '⚫ ЗАХИСТ'}
                                    </span>

                                    <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 flex items-center gap-1.5">
                                        <span>⚫ Захист: {activeSubBattle.defenderSquadName}</span>
                                        <span className="px-1.5 py-0.2 bg-black/60 rounded text-emerald-400">
                                            {activeSubBattle.tacticalPieces.filter(p => p.side === 'defender').length} шашок
                                        </span>
                                    </span>
                                </div>

                                {/* Tactical 8x8 Board Grid */}
                                <div className="flex justify-center my-2">
                                    <div className="grid grid-cols-8 grid-rows-8 gap-0.5 border-4 border-amber-950 rounded-xl overflow-hidden bg-[#0a0608] w-full max-w-[400px] aspect-square shadow-inner">
                                        {Array.from({ length: 64 }).map((_, idx) => {
                                            const r = Math.floor(idx / 8);
                                            const c = idx % 8;
                                            const isDark = (r + c) % 2 === 1;
                                            const sol = activeSubBattle.tacticalPieces.find(p => p.row === r && p.col === c);
                                            
                                            const selectedSol = activeSubBattle.selectedTacticalPieceId 
                                                ? activeSubBattle.tacticalPieces.find(p => p.id === activeSubBattle.selectedTacticalPieceId)
                                                : null;

                                            const validTacticalMoves = selectedSol 
                                                ? getValidTacticalMoves(selectedSol, activeSubBattle.tacticalPieces)
                                                : [];

                                            const moveDetail = validTacticalMoves.find(m => m.r === r && m.c === c);
                                            const isValidMove = !!moveDetail;
                                            const isSelected = sol && sol.id === activeSubBattle.selectedTacticalPieceId;
                                            const solHp = sol ? (sol.side === 'attacker' ? activeSubBattle.attackerSoldierHps[sol.soldierIndex] : activeSubBattle.defenderSoldierHps[sol.soldierIndex]) : 0;

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleTacticalTileClick(r, c)}
                                                    className={`relative flex items-center justify-center transition-all ${
                                                        isDark ? 'bg-[#3b231d] hover:bg-[#4d2d26]' : 'bg-[#c5b098]'
                                                    } ${isSelected ? 'ring-4 ring-yellow-400 z-10' : ''} ${
                                                        isValidMove ? 'cursor-pointer' : ''
                                                    }`}
                                                >
                                                    {/* Tile coordinates */}
                                                    {isDark && (
                                                        <span className="absolute top-0.5 left-0.5 text-[7px] text-amber-200/30 font-mono select-none">
                                                            {r + 1},{c + 1}
                                                        </span>
                                                    )}

                                                    {/* Highlight valid moves */}
                                                    {isValidMove && (
                                                        <div className={`absolute inset-1 rounded-full border-2 animate-pulse flex items-center justify-center ${
                                                            moveDetail?.isJump ? 'bg-rose-600/60 border-rose-300' : 'bg-emerald-500/50 border-emerald-300'
                                                        }`}>
                                                            <span className="text-white font-black text-xs">
                                                                {moveDetail?.isJump ? '⚔️' : '•'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Render Soldier Checker */}
                                                    {sol && (
                                                        <div className={`w-[85%] h-[85%] rounded-full border-2 flex flex-col items-center justify-center shadow-lg transition-transform cursor-pointer select-none ${
                                                            sol.side === 'attacker' 
                                                                ? 'bg-gradient-to-b from-red-600 to-rose-900 border-amber-300 text-white' 
                                                                : 'bg-gradient-to-b from-stone-800 to-black border-stone-400 text-stone-200'
                                                        }`}>
                                                            {sol.isKing && (
                                                                <Crown className="w-3 h-3 text-yellow-300 absolute -top-1" />
                                                            )}
                                                            <span className="text-xs font-bold leading-none">
                                                                {sol.side === 'attacker' ? '🔴' : '⚫'}
                                                            </span>
                                                            <span className="text-[8px] font-mono font-black text-emerald-300 px-1 bg-black/80 rounded border border-stone-800 mt-0.5">
                                                                {solHp} HP
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Tactical Logs */}
                                <div className="bg-black/50 p-2 rounded-xl border border-stone-800 text-[10px] font-mono text-stone-300 max-h-[80px] overflow-y-auto">
                                    {activeSubBattle.logs.map((lg, i) => (
                                        <div key={i}>{lg}</div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        onClick={handleInstantPlayerVictorySubBattle}
                                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-400/50"
                                    >
                                        <Sparkles className="w-4 h-4 text-yellow-300" />
                                        <span>⚡ АВТОПЕРЕМОГА (ЗНИЩИТИ ВОРОГА)</span>
                                    </button>
                                    <button
                                        onClick={handleAutoResolveSubBattle}
                                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 text-white font-bold text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <Swords className="w-4 h-4" />
                                          <span>Автоматично симуляція</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                )}
            </AnimatePresence>

            {/* 🪙 Coin Battle Overlay Modal (Військові шашки: битва монет 120 бійців) */}
            <AnimatePresence>
                {activeCoinBattle && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md p-3 sm:p-5 flex flex-col items-center justify-center overflow-y-auto select-none pointer-events-auto"
                    >
                        <div className="w-full max-w-2xl bg-[#1a1410] border-2 border-amber-500/80 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 text-stone-200">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-3xl p-1.5 bg-amber-950/80 border border-amber-500/40 rounded-xl">🪙</span>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-black text-amber-200 font-serif">
                                            Битва Військових Шашок — Бій Монет (120 Бійців)
                                        </h3>
                                        <p className="text-[11px] text-stone-400">
                                            Атака кидає N монет • Захист кидає M монет • Втрати захисника = N - M (якщо N &gt; M)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleInstantPlayerVictoryCoinBattle}
                                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer flex items-center gap-1 border border-emerald-400/50"
                                    title="Тестова швидка перемога гравця"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                                    <span>⚡ Автоперемога (Тест)</span>
                                </button>
                            </div>

                                {/* Opposing Squads Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Attacker */}
                                    <div className="p-3 rounded-xl bg-gradient-to-b from-red-950/60 to-black/60 border border-red-500/50 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1">
                                                ⚔️ Атакуючий Загін
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-200 font-mono font-bold border border-red-700">
                                                Рівень {activeCoinBattle.attackerLevel}★
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-3xl">{activeCoinBattle.attackerAvatar}</span>
                                            <div>
                                                <div className="text-sm font-bold text-amber-100">
                                                    {activeCoinBattle.attackerSquadName}
                                                </div>
                                                <div className="text-xs font-mono font-bold text-emerald-400">
                                                    N = {activeCoinBattle.attackerSoldiers} / 120 бійців (монет)
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-amber-300/90 font-medium bg-black/40 p-1.5 rounded-lg border border-stone-800">
                                            {getMilitarySquadPerkLabel(activeCoinBattle.attackerLevel)}
                                            {activeCoinBattle.attackerLevel >= 1 && (
                                                <span className="block text-emerald-400 font-bold mt-0.5">
                                                    ✨ Перекидання промахів атаки активне!
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Defender */}
                                    <div className="p-3 rounded-xl bg-gradient-to-b from-blue-950/60 to-black/60 border border-blue-500/50 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                                                🛡️ Захищаючийся Загін
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-200 font-mono font-bold border border-blue-700">
                                                Рівень {activeCoinBattle.defenderLevel}★
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-3xl">{activeCoinBattle.defenderAvatar}</span>
                                            <div>
                                                <div className="text-sm font-bold text-amber-100">
                                                    {activeCoinBattle.defenderSquadName}
                                                </div>
                                                <div className="text-xs font-mono font-bold text-blue-300">
                                                    M = {activeCoinBattle.defenderSoldiers} / 120 бійців (монет)
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-amber-300/90 font-medium bg-black/40 p-1.5 rounded-lg border border-stone-800">
                                            {getMilitarySquadPerkLabel(activeCoinBattle.defenderLevel)}
                                            {activeCoinBattle.defenderLevel >= 2 && (
                                                <span className="block text-blue-400 font-bold mt-0.5">
                                                    ✨ Перекидання невдалих блоків активне!
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 'ready' View */}
                                {activeCoinBattle.phase === 'ready' && (
                                    <div className="flex flex-col gap-3 py-1">
                                        <div className="bg-black/50 p-3 rounded-xl border border-stone-800 text-xs space-y-2">
                                            <div className="font-bold text-amber-300 flex items-center gap-1.5">
                                                <Coins className="w-4 h-4 text-amber-400" />
                                                <span>Правила битви монет із обов'язковою контратакою:</span>
                                            </div>
                                            <p className="text-stone-300">
                                                1. ⚔️ <b>Основна атака:</b> Атакуючий кидає <span className="text-amber-300 font-bold font-mono">{activeCoinBattle.attackerSoldiers}</span> монет на влучання (50% шанс).
                                                {activeCoinBattle.attackerLevel >= 1 ? ' Завдяки 1+★ промахи перекидаються!' : ''}
                                            </p>
                                            <p className="text-stone-300">
                                                2. 🛡️ <b>Захист першого удару:</b> Захисник кидає <span className="text-blue-300 font-bold font-mono">{activeCoinBattle.defenderSoldiers}</span> монет на блок (50% шанс).
                                                {activeCoinBattle.defenderLevel >= 2 ? ' Завдяки 2+★ невдалі блоки перекидаються!' : ''}
                                            </p>
                                            <p className="text-stone-300">
                                                3. 🩸 <b>Втрати захисника:</b> N - M пошкоджень (якщо влучань більше ніж блоків).
                                            </p>
                                            <p className="text-emerald-300 font-semibold bg-emerald-950/40 p-2 rounded-lg border border-emerald-600/40">
                                                4. ⚡ <b>Обов'язкова Контратака Захисника:</b> якщо у захисника вижив хоча б один боєць, вони наносять контрудар усіма вцілілими монетами, а атакуючий загін кидає монети на захист!
                                            </p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                            <button
                                                onClick={() => resolveCoinBattle()}
                                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2"
                                            >
                                                <Coins className="w-5 h-5 animate-bounce" />
                                                <span>Кинути Монети (Атака + Контратака Захисника)!</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Phase 'result' View */}
                                {activeCoinBattle.phase === 'result' && (
                                    <div className="flex flex-col gap-3">
                                        {/* ETAP 1: Main Attack Breakdown */}
                                        <div className="p-3 rounded-xl bg-black/60 border border-stone-800 space-y-2">
                                            <div className="text-xs font-black text-amber-300 flex items-center justify-between border-b border-stone-800 pb-1.5">
                                                <span className="flex items-center gap-1.5">
                                                    <span>⚔️ ЕТАП 1: ОСНОВНА АТАКА</span>
                                                </span>
                                                <span className="text-[11px] font-mono text-stone-400">
                                                    Втрати захисника: <b className="text-rose-400">-{activeCoinBattle.defenderCasualties || 0}</b> б.
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-center">
                                                    <div className="text-[10px] text-stone-400">Влучань Атаки ({activeCoinBattle.attackerSquadName})</div>
                                                    <div className="text-xl font-black font-mono text-amber-300">
                                                        {activeCoinBattle.totalAttackHits}
                                                    </div>
                                                    <div className="text-[9px] text-stone-400">
                                                        {activeCoinBattle.initialAttackHits} базових {activeCoinBattle.rerollAttackHits ? `+ ${activeCoinBattle.rerollAttackHits} перекид` : ''}
                                                    </div>
                                                </div>
                                                <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-center">
                                                    <div className="text-[10px] text-stone-400">Блоків Захисника ({activeCoinBattle.defenderSquadName})</div>
                                                    <div className="text-xl font-black font-mono text-blue-300">
                                                        {activeCoinBattle.totalDefBlocks}
                                                    </div>
                                                    <div className="text-[9px] text-stone-400">
                                                        {activeCoinBattle.initialDefBlocks} базових {activeCoinBattle.rerollDefBlocks ? `+ ${activeCoinBattle.rerollDefBlocks} перекид` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-stone-300 flex items-center justify-between px-1">
                                                <span>У захисника вціліло:</span>
                                                <span className="font-mono font-bold text-emerald-400">
                                                    {activeCoinBattle.survivingDefenderSoldiers} / 120 бійців
                                                </span>
                                            </div>
                                        </div>

                                        {/* ETAP 2: Counter-Attack Breakdown */}
                                        <div className="p-3 rounded-xl bg-black/60 border border-emerald-900/60 space-y-2">
                                            <div className="text-xs font-black text-emerald-300 flex items-center justify-between border-b border-stone-800 pb-1.5">
                                                <span className="flex items-center gap-1.5">
                                                    <span>⚡ ЕТАП 2: КОНТРАТАКА ЗАХИСНИКА</span>
                                                </span>
                                                <span className="text-[11px] font-mono text-stone-400">
                                                    Втрати атакуючого: <b className="text-rose-400">-{activeCoinBattle.attackerCasualties || 0}</b> б.
                                                </span>
                                            </div>
                                            {activeCoinBattle.hasCounterAttack ? (
                                                <>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-center">
                                                            <div className="text-[10px] text-emerald-400">Контрудар Захисника ({activeCoinBattle.survivingDefenderSoldiers} б.)</div>
                                                            <div className="text-xl font-black font-mono text-emerald-300">
                                                                {activeCoinBattle.totalCounterHits}
                                                            </div>
                                                            <div className="text-[9px] text-stone-400">
                                                                {activeCoinBattle.initialCounterHits} базових {activeCoinBattle.rerollCounterHits ? `+ ${activeCoinBattle.rerollCounterHits} перекид` : ''}
                                                            </div>
                                                        </div>
                                                        <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-center">
                                                            <div className="text-[10px] text-amber-400">Блоки Атакуючого ({activeCoinBattle.attackerSquadName})</div>
                                                            <div className="text-xl font-black font-mono text-amber-300">
                                                                {activeCoinBattle.totalAttackerBlocks}
                                                            </div>
                                                            <div className="text-[9px] text-stone-400">
                                                                {activeCoinBattle.initialAttackerBlocks} базових {activeCoinBattle.rerollAttackerBlocks ? `+ ${activeCoinBattle.rerollAttackerBlocks} перекид` : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-[11px] text-stone-300 flex items-center justify-between px-1">
                                                        <span>В атакуючого вціліло після контратаки:</span>
                                                        <span className="font-mono font-bold text-amber-300">
                                                            {activeCoinBattle.survivingAttackerSoldiers} / 120 бійців
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/40 text-center text-rose-300 text-xs">
                                                    💀 Загін захисника було повністю розгромлено першим ударом — контратаку нанести нікому!
                                                </div>
                                            )}
                                        </div>

                                        {/* Total Summary */}
                                        <div className={`p-3 rounded-xl border text-xs font-medium space-y-1 ${
                                            activeCoinBattle.attackerWon 
                                                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                                                : activeCoinBattle.defenderCounterWon
                                                ? 'bg-blue-950/50 border-blue-500/50 text-blue-200'
                                                : activeCoinBattle.bothDestroyed
                                                ? 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                                                : 'bg-stone-900 border-amber-500/40 text-amber-200'
                                        }`}>
                                            <div className="font-bold text-sm">
                                                {activeCoinBattle.attackerWon 
                                                    ? '🏆 ПЕРЕМОГА АТАКИ! Загін захисника знищено, атакуючий займає клітинку!' 
                                                    : activeCoinBattle.defenderCounterWon
                                                    ? '🛡️ ПЕРЕМОГА КОНТРАТАКИ! Захисник відбив напад і знищив атакуючих!'
                                                    : activeCoinBattle.bothDestroyed
                                                    ? '☠️ Обидва загони знищили один одного в запеклому бою!'
                                                    : '🤝 ОБИДВА ЗАГОНИ ВЦІЛІЛИ! Обмінялися ударами та утримують свої позиції.'}
                                            </div>
                                            <p className="text-[11px] text-stone-300">
                                                Фінальний склад: «{activeCoinBattle.attackerSquadName}» — {activeCoinBattle.survivingAttackerSoldiers}/120 бійців • «{activeCoinBattle.defenderSquadName}» — {activeCoinBattle.survivingDefenderSoldiers}/120 бійців.
                                            </p>
                                        </div>

                                        {/* Logs */}
                                        <div className="bg-black/50 p-2 rounded-xl border border-stone-900 max-h-20 overflow-y-auto text-[10px] font-mono space-y-0.5 text-stone-400">
                                            {activeCoinBattle.logs.map((log, i) => (
                                                <div key={i}>{log}</div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={applyCoinBattleResult}
                                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 text-white font-extrabold text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <span>Застосувати результат битви та продовжити</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                )}
            </AnimatePresence>

            {/* Game Over Modal */}
            <AnimatePresence>
                {gameOver && (
                    <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md p-4 flex items-center justify-center select-none pointer-events-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#211218] border-2 border-amber-500/80 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl"
                        >
                            <div className="text-5xl">
                                {gameOver === 'victory' ? '🏆' : '💀'}
                            </div>

                            <h3 className={`text-2xl font-black font-serif ${
                                gameOver === 'victory' ? 'text-amber-200' : 'text-rose-400'
                            }`}>
                                {gameOver === 'victory' 
                                    ? `Тріумфальна Перемога!` 
                                    : `Нищівна Поразка!`}
                            </h3>

                            <p className="text-xs text-stone-300">
                                {gameOver === 'victory' 
                                    ? `Ви розгромили всі 12 загонів суперника ${opponent.name}! Ваші вцілілі загони отримали досвід (XP).` 
                                    : `Ваші 12 загонів були розбиті в ${variant === 'aranian_military_checkers' ? 'Аранійських військових шашках' : variant === 'military_checkers' ? 'Військових шашках' : variant === 'aranian_checkers_war' ? 'Аранійських армійських шашках' : 'Армійських шашках'}.`}
                            </p>

                            <button
                                onClick={onClose}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-stone-950 font-extrabold text-sm shadow-lg transition cursor-pointer"
                            >
                                Повернутися в Таверну
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData, TavernData, SettlementData, WorldProgress, ArmySquad, HiredCompanion, CharacterGender } from '../types';
import { 
    getSquadMaxMoveDistance, 
    getSquadAttackRange, 
    getSquadAttackBonus, 
    getSquadDefenseBonus, 
    decompressSquadToCompanions, 
    createStarterArmy16Squads,
    ARMY_SQUAD_CATALOG,
    getGridDistance,
    DecompressOptions
} from '../lib/toySoldiersData';
import { DecompressChoiceModal, DecompressUnitInfo } from './DecompressChoiceModal';
import { getCompanionSprite } from '../lib/companionSprites';
import { saveWorldProgress } from '../lib/worldData';
import { 
    playDiceRollSound, 
    playSwordClashSound, 
    playShieldBlockSound, 
    playVictorySound, 
    playDefeatSound, 
    playGoldSound, 
    playLevelUpSound 
} from '../lib/soundEffects';
import { 
    X, 
    Shield, 
    Sword, 
    Heart, 
    Sparkles, 
    AlertTriangle, 
    Trophy, 
    Coins, 
    Award, 
    ShoppingBag, 
    RefreshCw, 
    ChevronRight, 
    Users,
    Flag,
    Zap,
    Crown,
    CheckCircle2
} from 'lucide-react';

const BOARD_SIZE = 16;
const REQUIRED_SQUADS = 16;

interface SquadBattleUnit {
    id: string;
    team: 'player' | 'opponent';
    name: string;
    avatar: string;
    type: ArmySquad['type'];
    x: number;
    y: number;
    soldiersCount: number; // 1..5 living soldiers
    maxSoldiers: number; // always 5
    level: number;
    experience: number;
    maxMoveDistance: number;
    attackRange: number;
    hasActed: boolean;
    hasMoved?: boolean;
    isAlive: boolean;
    squadRef?: ArmySquad;
}

interface ArmyBattleModalProps {
    isOpen: boolean;
    onClose: () => void;
    opponent: OpponentData;
    tavern?: TavernData;
    tavernName?: string;
    settlement?: SettlementData;
    progress: WorldProgress;
    betAmount?: number;
    onUpdateProgress: (newProgress: WorldProgress) => void;
    onVictory?: (updatedProgress: WorldProgress) => void;
    onDefeat?: (updatedProgress: WorldProgress) => void;
    onOpenToyShop?: () => void;
    onOpenDecompressionMaster?: () => void;
}

export function ArmyBattleModal({
    isOpen,
    onClose,
    opponent,
    tavern,
    tavernName,
    settlement,
    progress,
    betAmount = 25,
    onUpdateProgress,
    onVictory,
    onDefeat,
    onOpenToyShop,
    onOpenDecompressionMaster
}: ArmyBattleModalProps) {
    const displayTavernName = tavernName || tavern?.name || 'Таверна';
    const playerSquads: ArmySquad[] = progress.armySquads || [];
    const hasEnoughSquads = playerSquads.length >= REQUIRED_SQUADS;

    // View mode: 'battle' by default for immediate action, or 'assembly'
    const [viewMode, setViewMode] = useState<'assembly' | 'battle'>('battle');
    
    // Battle state
    const [units, setUnits] = useState<SquadBattleUnit[]>([]);
    const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent'>('player');
    const [roundNumber, setRoundNumber] = useState<number>(1);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [actionLog, setActionLog] = useState<string[]>([]);
    const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
    const [battleOutcome, setBattleOutcome] = useState<'in_progress' | 'victory' | 'defeat'>('in_progress');

    const unitsRef = useRef<SquadBattleUnit[]>([]);
    const turnRef = useRef<'player' | 'opponent'>('player');
    const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        unitsRef.current = units;
    }, [units]);

    useEffect(() => {
        turnRef.current = currentTurn;
    }, [currentTurn]);

    // Active Clash Modal State (N attack dice vs M defense dice)
    const [activeClash, setActiveClash] = useState<{
        attacker: SquadBattleUnit;
        defender: SquadBattleUnit;
        attackDiceCount: number; // N
        defenseDiceCount: number; // M
        isRolling: boolean;
        rolled: boolean;
        attackerDice: number[];
        defenderDice: number[];
        attackerBonus: number;
        defenderBonus: number;
        matches: {
            pairIndex: number;
            attVal: number;
            defVal: number;
            hit: boolean;
        }[];
        unmatchedAttackerHits: number;
        totalLosses: number;
    } | null>(null);

    // Decompression modal/notification state
    const [decompressedCompanions, setDecompressedCompanions] = useState<HiredCompanion[] | null>(null);
    const [choiceModalUnit, setChoiceModalUnit] = useState<DecompressUnitInfo | null>(null);
    const [targetSquad, setTargetSquad] = useState<ArmySquad | null>(null);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (aiTimeoutRef.current) {
                clearTimeout(aiTimeoutRef.current);
            }
        };
    }, []);

    // Safety watchdog for opponent turn completion: if AI finished all moves but state remained stuck
    useEffect(() => {
        if (currentTurn === 'opponent' && !activeClash && battleOutcome === 'in_progress') {
            const livingPlayer = units.filter(u => u.team === 'player' && u.isAlive && u.soldiersCount > 0);
            const readyAi = units.filter(u => u.team === 'opponent' && u.isAlive && u.soldiersCount > 0 && !u.hasActed);
            
            if (readyAi.length === 0 && livingPlayer.length > 0) {
                const watchdogTimer = setTimeout(() => {
                    const currentReady = (unitsRef.current.length > 0 ? unitsRef.current : units).filter(
                        u => u.team === 'opponent' && u.isAlive && u.soldiersCount > 0 && !u.hasActed
                    );
                    if (currentReady.length === 0 && turnRef.current === 'opponent') {
                        setIsAiThinking(false);
                        startPlayerTurn(unitsRef.current.length > 0 ? unitsRef.current : units);
                    }
                }, 400);
                return () => clearTimeout(watchdogTimer);
            }
        }
    }, [currentTurn, activeClash, units, battleOutcome]);

    // Initialize battle units when launching battle
    const initializeBattle = (squadsOverride?: ArmySquad[]) => {
        let squadsToUse = squadsOverride || progress.armySquads || [];
        if (squadsToUse.length < REQUIRED_SQUADS) {
            squadsToUse = createStarterArmy16Squads();
            const updated: WorldProgress = {
                ...progress,
                armySquads: squadsToUse
            };
            onUpdateProgress(updated);
            saveWorldProgress(updated);
        }

        const newUnits: SquadBattleUnit[] = [];

        // 1. Setup Opponent Army (16 Squads on rows 0 and 1)
        const opponentTemplates: { name: string; avatar: string; type: ArmySquad['type'] }[] = [
            { name: 'Ворожа Піхота I', avatar: '⚔️', type: 'піхота' },
            { name: 'Ворожа Піхота II', avatar: '⚔️', type: 'піхота' },
            { name: 'Ворожа Піхота III', avatar: '⚔️', type: 'піхота' },
            { name: 'Ворожа Піхота IV', avatar: '⚔️', type: 'піхота' },
            { name: 'Ворожі Лучники I', avatar: '🏹', type: 'стрільці' },
            { name: 'Ворожі Лучники II', avatar: '🏹', type: 'стрільці' },
            { name: 'Ворожі Лучники III', avatar: '🏹', type: 'стрільці' },
            { name: 'Ворожі Лучники IV', avatar: '🏹', type: 'стрільці' },
            { name: 'Ворожі Щитоносці I', avatar: '🛡️', type: 'щитоносці' },
            { name: 'Ворожі Щитоносці II', avatar: '🛡️', type: 'щитоносці' },
            { name: 'Ворожі Щитоносці III', avatar: '🛡️', type: 'щитоносці' },
            { name: 'Темні Лицарі I', avatar: '🤺', type: 'лицарі' },
            { name: 'Темні Лицарі II', avatar: '🤺', type: 'лицарі' },
            { name: 'Ворожі Вершники I', avatar: '🐎', type: 'вершники' },
            { name: 'Ворожі Вершники II', avatar: '🐎', type: 'вершники' },
            { name: 'Ворожі Чорнокнижники', avatar: '🧙‍♂️', type: 'маги' }
        ];

        // Place opponent squads: row 0 (columns 0..7, 8..15) and row 1 (columns 0..7, 8..15)
        opponentTemplates.forEach((t, idx) => {
            const row = Math.floor(idx / 8); // 0 or 1
            const col = (idx % 8) * 2; // 0, 2, 4, 6, 8, 10, 12, 14
            newUnits.push({
                id: `enemy_squad_${idx}`,
                team: 'opponent',
                name: t.name,
                avatar: t.avatar,
                type: t.type,
                x: col,
                y: row,
                soldiersCount: 5,
                maxSoldiers: 5,
                level: Math.floor(Math.random() * 2), // 0 or 1
                experience: 0,
                maxMoveDistance: getSquadMaxMoveDistance(t.type),
                attackRange: getSquadAttackRange(t.type),
                hasActed: false,
                hasMoved: false,
                isAlive: true
            });
        });

        // 2. Setup Player Army (First 16 squads on rows 14 and 15)
        const deployedPlayerSquads = squadsToUse.slice(0, REQUIRED_SQUADS);
        deployedPlayerSquads.forEach((sq, idx) => {
            const row = 14 + Math.floor(idx / 8); // 14 or 15
            const col = (idx % 8) * 2; // 0, 2, 4, 6, 8, 10, 12, 14
            newUnits.push({
                id: `player_squad_${sq.id}_${idx}`,
                team: 'player',
                name: sq.name,
                avatar: sq.avatar,
                type: sq.type,
                x: col,
                y: row,
                soldiersCount: Math.max(1, Math.min(5, sq.soldiersCount || 5)),
                maxSoldiers: 5,
                level: sq.level || 0,
                experience: sq.experience || 0,
                maxMoveDistance: getSquadMaxMoveDistance(sq.type),
                attackRange: getSquadAttackRange(sq.type),
                hasActed: false,
                hasMoved: false,
                isAlive: true,
                squadRef: sq
            });
        });

        setUnits(newUnits);
        setCurrentTurn('player');
        setRoundNumber(1);
        setSelectedUnitId(null);
        setActiveClash(null);
        setBattleOutcome('in_progress');
        setActionLog([
            `⚔️ БИТВУ АРМІЙ РОЗПОЧАТО! 16 загонів (${displayTavernName}) проти війська супротивника: ${opponent.name}!`,
            `📜 Правила бою: кожен загін кидає N кубиків атаки проти M кубиків захисту (N і M — кількість живих солдат у загонах).`,
            `🎖️ Хід гравця: оберіть загін для маневру та атаки.`
        ]);
        setViewMode('battle');
    };

    // Auto-initialize when opening for instant combat
    useEffect(() => {
        if (isOpen) {
            initializeBattle();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Check battle outcome
    const checkWinCondition = (currentUnits: SquadBattleUnit[]) => {
        const aliveEnemies = currentUnits.filter(u => u.team === 'opponent' && u.isAlive && u.soldiersCount > 0);
        const alivePlayers = currentUnits.filter(u => u.team === 'player' && u.isAlive && u.soldiersCount > 0);

        if (aliveEnemies.length === 0) {
            // Player Victory!
            setBattleOutcome('victory');
            playVictorySound();
            const goldWon = betAmount * 2 + 150;
            const xpWon = 200;
            const repWon = 30;

            // Grant +2 XP to all surviving player squads
            const updatedArmySquads = (progress.armySquads || []).map(sq => {
                const matchedUnit = currentUnits.find(u => u.squadRef?.id === sq.id);
                if (matchedUnit && matchedUnit.isAlive && matchedUnit.soldiersCount > 0) {
                    const newXp = (sq.experience || 0) + 2;
                    const newLvl = Math.min(4, Math.floor(newXp / 10));
                    return {
                        ...sq,
                        soldiersCount: matchedUnit.soldiersCount,
                        experience: newXp,
                        level: newLvl
                    };
                } else if (matchedUnit && matchedUnit.soldiersCount <= 0) {
                    return {
                        ...sq,
                        soldiersCount: 1, // Replenishes to 1 reserve survivor after battle
                        deaths: (sq.deaths || 0) + 1
                    };
                }
                return sq;
            });

            const newProgress: WorldProgress = {
                ...progress,
                playerGold: progress.playerGold + goldWon,
                playerReputation: progress.playerReputation + repWon,
                armySquads: updatedArmySquads,
                playerStats: {
                    ...progress.playerStats,
                    xp: progress.playerStats.xp + xpWon
                }
            };

            onUpdateProgress(newProgress);
            saveWorldProgress(newProgress);
            if (onVictory) onVictory(newProgress);
            return true;
        } else if (alivePlayers.length === 0) {
            // Defeat!
            setBattleOutcome('defeat');
            playDefeatSound();

            const updatedArmySquads = (progress.armySquads || []).map(sq => {
                const matchedUnit = currentUnits.find(u => u.squadRef?.id === sq.id);
                if (matchedUnit) {
                    return {
                        ...sq,
                        soldiersCount: 1, // Reserve recovery
                        deaths: (sq.deaths || 0) + 1
                    };
                }
                return sq;
            });

            const newProgress: WorldProgress = {
                ...progress,
                playerGold: Math.max(0, progress.playerGold - betAmount),
                armySquads: updatedArmySquads
            };

            onUpdateProgress(newProgress);
            saveWorldProgress(newProgress);
            if (onDefeat) onDefeat(newProgress);
            return true;
        }
        return false;
    };

    // Start Player's turn
    const startPlayerTurn = (currentUnits: SquadBattleUnit[]) => {
        if (checkWinCondition(currentUnits)) return;

        const resetPlayerUnits = currentUnits.map(u => 
            u.team === 'player' ? { ...u, hasActed: false, hasMoved: false } : u
        );
        setUnits(resetPlayerUnits);
        unitsRef.current = resetPlayerUnits;
        setCurrentTurn('player');
        turnRef.current = 'player';
        setRoundNumber(r => r + 1);
        setSelectedUnitId(null);
        setIsAiThinking(false);
        setActionLog(prev => [`--- РАУНД ${roundNumber + 1}: ВАШ ХІД ---`, ...prev.slice(0, 15)]);
    };

    // Start Opponent's turn
    const startOpponentTurn = (currentUnits: SquadBattleUnit[]) => {
        if (checkWinCondition(currentUnits)) return;

        const resetAiUnits = currentUnits.map(u => 
            u.team === 'opponent' ? { ...u, hasActed: false, hasMoved: false } : u
        );
        setUnits(resetAiUnits);
        unitsRef.current = resetAiUnits;
        setCurrentTurn('opponent');
        turnRef.current = 'opponent';
        setSelectedUnitId(null);
        setIsAiThinking(true);
        setActionLog(prev => [`--- ХІД СУПРОТИВНИКА ---`, ...prev.slice(0, 15)]);

        setTimeout(() => {
            triggerAiTurn(resetAiUnits);
        }, 500);
    };

    // End turn & advance (switch player <-> opponent)
    const advanceTurn = (newUnits: SquadBattleUnit[]) => {
        if (checkWinCondition(newUnits)) return;

        if (turnRef.current === 'player') {
            startOpponentTurn(newUnits);
        } else {
            startPlayerTurn(newUnits);
        }
    };

    // Roll N vs M Dice Combat
    const resolveClash = (attacker: SquadBattleUnit, defender: SquadBattleUnit) => {
        const N = Math.max(1, attacker.soldiersCount); // Attacker rolls N dice
        const M = Math.max(1, defender.soldiersCount); // Defender rolls M dice

        const attBonus = getSquadAttackBonus(attacker.squadRef || (attacker as any));
        const defBonus = getSquadDefenseBonus(defender.squadRef || (defender as any));

        playDiceRollSound();

        // Roll N dice for attacker
        const attDice: number[] = [];
        for (let i = 0; i < N; i++) {
            attDice.push(Math.floor(Math.random() * 6) + 1);
        }
        // Roll M dice for defender
        const defDice: number[] = [];
        for (let i = 0; i < M; i++) {
            defDice.push(Math.floor(Math.random() * 6) + 1);
        }

        // Sort descending
        attDice.sort((a, b) => b - a);
        defDice.sort((a, b) => b - a);

        // Apply level bonus to the highest die
        if (attBonus > 0 && attDice.length > 0) {
            attDice[0] = Math.min(6, attDice[0] + attBonus);
        }
        if (defBonus > 0 && defDice.length > 0) {
            defDice[0] = Math.min(6, defDice[0] + defBonus);
        }

        // Pairwise comparison for min(N, M)
        const compareCount = Math.min(N, M);
        const matches: { pairIndex: number; attVal: number; defVal: number; hit: boolean }[] = [];
        let losses = 0;

        for (let i = 0; i < compareCount; i++) {
            const hit = attDice[i] > defDice[i];
            if (hit) losses++;
            matches.push({
                pairIndex: i + 1,
                attVal: attDice[i],
                defVal: defDice[i],
                hit
            });
        }

        // Unmatched attacker dice (if N > M) score hits on 5 or 6
        let unmatchedHits = 0;
        if (N > M) {
            for (let i = M; i < N; i++) {
                if (attDice[i] >= 5) {
                    unmatchedHits++;
                    losses++;
                }
            }
        }

        // Ensure losses cannot exceed current soldiers in defender
        const actualLosses = Math.min(defender.soldiersCount, losses);

        setActiveClash({
            attacker,
            defender,
            attackDiceCount: N,
            defenseDiceCount: M,
            isRolling: false,
            rolled: true,
            attackerDice: attDice,
            defenderDice: defDice,
            attackerBonus: attBonus,
            defenderBonus: defBonus,
            matches,
            unmatchedAttackerHits: unmatchedHits,
            totalLosses: actualLosses
        });
    };

    // Apply clash results
    const applyClashResult = () => {
        if (!activeClash) return;

        const { attacker, defender, totalLosses, attackerDice, defenderDice } = activeClash;
        const newDefenderCount = Math.max(0, defender.soldiersCount - totalLosses);
        const isDefenderDead = newDefenderCount <= 0;

        if (totalLosses > 0) {
            playSwordClashSound(true, false);
        } else {
            playShieldBlockSound();
        }

        const baseUnits = unitsRef.current.length > 0 ? unitsRef.current : units;
        const updatedUnits = baseUnits.map(u => {
            if (u.id === defender.id) {
                return {
                    ...u,
                    soldiersCount: newDefenderCount,
                    isAlive: !isDefenderDead
                };
            }
            if (u.id === attacker.id) {
                return {
                    ...u,
                    hasMoved: true,
                    hasActed: true
                };
            }
            return u;
        });

        const logMsg = totalLosses > 0
            ? `⚔️ ${attacker.name} (N=${attacker.soldiersCount}) атакує ${defender.name} (M=${defender.soldiersCount})! Кидок [${attackerDice.join(',')}] vs [${defenderDice.join(',')}]. Влучань: ${totalLosses}! Залишилось: ${newDefenderCount}/5 солдатів.${isDefenderDead ? ' 💀 Загін знищено!' : ''}`
            : `🛡️ ${defender.name} витримав штурм ${attacker.name}! [${attackerDice.join(',')}] vs [${defenderDice.join(',')}]. Усі удари заблоковано!`;

        setActionLog(prev => [logMsg, ...prev.slice(0, 15)]);
        setUnits(updatedUnits);
        unitsRef.current = updatedUnits;
        setActiveClash(null);
        setSelectedUnitId(null);

        if (checkWinCondition(updatedUnits)) return;

        const isPlayerAttacker = attacker.team === 'player';

        if (isPlayerAttacker) {
            const readyPlayer = updatedUnits.filter(u => u.team === 'player' && u.isAlive && u.soldiersCount > 0 && !u.hasActed);
            if (readyPlayer.length === 0) {
                startOpponentTurn(updatedUnits);
            }
        } else {
            const readyAi = updatedUnits.filter(u => u.team === 'opponent' && u.isAlive && u.soldiersCount > 0 && !u.hasActed);
            if (readyAi.length === 0) {
                setIsAiThinking(false);
                startPlayerTurn(updatedUnits);
            } else {
                if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
                aiTimeoutRef.current = setTimeout(() => triggerAiTurn(updatedUnits), 450);
            }
        }
    };

    // Helper: find best step towards target that is not occupied
    const findAiStep = (aiUnit: SquadBattleUnit, targetX: number, targetY: number, baseUnits: SquadBattleUnit[]): { x: number; y: number } => {
        const dx = Math.sign(targetX - aiUnit.x);
        const dy = Math.sign(targetY - aiUnit.y);
        const maxStep = Math.min(aiUnit.maxMoveDistance, 3);

        // Try direct step from maxStep down to 1
        for (let s = maxStep; s >= 1; s--) {
            const tryX = Math.max(0, Math.min(BOARD_SIZE - 1, aiUnit.x + dx * s));
            const tryY = Math.max(0, Math.min(BOARD_SIZE - 1, aiUnit.y + dy * s));
            const isOccupied = baseUnits.some(u => u.isAlive && u.id !== aiUnit.id && u.x === tryX && u.y === tryY);
            if (!isOccupied) {
                return { x: tryX, y: tryY };
            }
        }

        // Try single orthogonal moves if diagonal is blocked
        const fallbackCandidates = [
            { x: Math.max(0, Math.min(BOARD_SIZE - 1, aiUnit.x + dx)), y: aiUnit.y },
            { x: aiUnit.x, y: Math.max(0, Math.min(BOARD_SIZE - 1, aiUnit.y + dy)) },
            { x: Math.max(0, Math.min(BOARD_SIZE - 1, aiUnit.x + 1)), y: aiUnit.y },
            { x: Math.max(0, Math.min(BOARD_SIZE - 1, aiUnit.x - 1)), y: aiUnit.y },
            { x: aiUnit.x, y: Math.max(0, Math.min(BOARD_SIZE - 1, aiUnit.y + 1)) },
            { x: aiUnit.x, y: Math.max(0, Math.min(BOARD_SIZE - 1, aiUnit.y - 1)) }
        ];

        let bestCandidate = { x: aiUnit.x, y: aiUnit.y };
        let bestDist = getGridDistance(aiUnit.x, aiUnit.y, targetX, targetY);

        for (const cand of fallbackCandidates) {
            const isOccupied = baseUnits.some(u => u.isAlive && u.id !== aiUnit.id && u.x === cand.x && u.y === cand.y);
            if (!isOccupied) {
                const dist = getGridDistance(cand.x, cand.y, targetX, targetY);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestCandidate = cand;
                }
            }
        }

        return bestCandidate;
    };

    // AI Turn Logic - Processes ALL living AI units sequentially in each round
    const triggerAiTurn = (currentUnits: SquadBattleUnit[]) => {
        const baseUnits = currentUnits || unitsRef.current;
        if (checkWinCondition(baseUnits)) {
            setIsAiThinking(false);
            return;
        }

        turnRef.current = 'opponent';
        setCurrentTurn('opponent');
        setIsAiThinking(true);

        const readyAi = baseUnits.filter(u => u.team === 'opponent' && u.isAlive && u.soldiersCount > 0 && !u.hasActed);
        const livingPlayer = baseUnits.filter(u => u.team === 'player' && u.isAlive && u.soldiersCount > 0);

        if (readyAi.length === 0 || livingPlayer.length === 0) {
            setIsAiThinking(false);
            startPlayerTurn(baseUnits);
            return;
        }

        // Pick the next ready AI unit closest to any living player unit
        let aiUnit = readyAi[0];
        let closestPlayer = livingPlayer[0];
        let minDistance = 999;

        readyAi.forEach(ai => {
            livingPlayer.forEach(p => {
                const dist = getGridDistance(ai.x, ai.y, p.x, p.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    aiUnit = ai;
                    closestPlayer = p;
                }
            });
        });

        // 1. If already in attack range, resolve clash directly
        if (minDistance <= aiUnit.attackRange) {
            const updated = baseUnits.map(u => u.id === aiUnit.id ? { ...u, hasActed: true, hasMoved: true } : u);
            setUnits(updated);
            unitsRef.current = updated;
            const updatedAi = { ...aiUnit, hasActed: true, hasMoved: true };
            resolveClash(updatedAi, closestPlayer);
        } else {
            // 2. Otherwise move towards player using smart pathing
            const stepPos = findAiStep(aiUnit, closestPlayer.x, closestPlayer.y, baseUnits);
            const finalX = stepPos.x;
            const finalY = stepPos.y;

            const newDist = getGridDistance(finalX, finalY, closestPlayer.x, closestPlayer.y);
            const inRangeNow = newDist <= aiUnit.attackRange;

            const movedUnits = baseUnits.map(u => u.id === aiUnit.id
                ? { ...u, x: finalX, y: finalY, hasActed: true, hasMoved: true }
                : u
            );
            setUnits(movedUnits);
            unitsRef.current = movedUnits;

            if (inRangeNow) {
                const updatedAiUnit = { ...aiUnit, x: finalX, y: finalY, hasActed: true, hasMoved: true };
                resolveClash(updatedAiUnit, closestPlayer);
            } else {
                setActionLog(prev => [`👣 ${aiUnit.name} пересунувся на [${finalX}, ${finalY}].`, ...prev.slice(0, 15)]);
                
                const remainingAi = movedUnits.filter(u => u.team === 'opponent' && u.isAlive && u.soldiersCount > 0 && !u.hasActed);
                if (remainingAi.length > 0) {
                    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
                    aiTimeoutRef.current = setTimeout(() => triggerAiTurn(movedUnits), 400);
                } else {
                    setIsAiThinking(false);
                    startPlayerTurn(movedUnits);
                }
            }
        }
    };

    // Handle tile click for moving or attacking
    const handleTileClick = (targetX: number, targetY: number) => {
        if (currentTurn !== 'player' || isAiThinking) return;

        // If no unit selected, check if clicked a player unit
        const clickedUnit = units.find(u => u.isAlive && u.x === targetX && u.y === targetY);

        if (!selectedUnitId) {
            if (clickedUnit && clickedUnit.team === 'player' && !clickedUnit.hasActed) {
                setSelectedUnitId(clickedUnit.id);
            }
            return;
        }

        const selectedUnit = units.find(u => u.id === selectedUnitId);
        if (!selectedUnit) return;

        // Clicked the same unit -> if it has moved, complete its action, else deselect
        if (clickedUnit && clickedUnit.id === selectedUnit.id) {
            if (selectedUnit.hasMoved) {
                const updated = units.map(u => u.id === selectedUnit.id ? { ...u, hasActed: true } : u);
                setUnits(updated);
                setSelectedUnitId(null);
                setActionLog(prev => [`🛡️ ${selectedUnit.name} завершив хід.`, ...prev.slice(0, 15)]);
                const readyUnits = updated.filter(u => u.team === 'player' && u.isAlive && !u.hasActed);
                if (readyUnits.length === 0) {
                    advanceTurn(updated);
                }
            } else {
                setSelectedUnitId(null);
            }
            return;
        }

        // Clicked another player unit -> switch selection (and mark selectedUnit as hasActed if it already moved)
        if (clickedUnit && clickedUnit.team === 'player') {
            if (selectedUnit.hasMoved) {
                const updated = units.map(u => u.id === selectedUnit.id ? { ...u, hasActed: true } : u);
                setUnits(updated);
            }
            if (!clickedUnit.hasActed) {
                setSelectedUnitId(clickedUnit.id);
            } else {
                setSelectedUnitId(null);
            }
            return;
        }

        const distance = getGridDistance(selectedUnit.x, selectedUnit.y, targetX, targetY);

        // Clicked enemy unit -> check attack range
        if (clickedUnit && clickedUnit.team === 'opponent') {
            if (distance <= selectedUnit.attackRange) {
                resolveClash(selectedUnit, clickedUnit);
            } else {
                setActionLog(prev => [`❌ Ворог надто далеко для атаки (дистанція ${distance}, дальність ${selectedUnit.attackRange} кл.).`, ...prev.slice(0, 15)]);
            }
            return;
        }

        // Clicked empty tile -> move unit if in move range and hasn't moved yet
        if (!clickedUnit) {
            if (selectedUnit.hasMoved || selectedUnit.hasActed) {
                setActionLog(prev => [`❌ ${selectedUnit.name} вже здійснював переміщення в цьому раунді!`, ...prev.slice(0, 15)]);
                return;
            }

            if (distance <= selectedUnit.maxMoveDistance) {
                // Check if any living enemy is in attack range from the target tile
                const enemiesInAttackRange = units.some(
                    u => u.team === 'opponent' && u.isAlive && getGridDistance(targetX, targetY, u.x, u.y) <= selectedUnit.attackRange
                );

                const hasActedNow = !enemiesInAttackRange;

                const updated = units.map(u => u.id === selectedUnit.id
                    ? { ...u, x: targetX, y: targetY, hasMoved: true, hasActed: hasActedNow }
                    : u
                );

                setUnits(updated);

                if (enemiesInAttackRange) {
                    setSelectedUnitId(selectedUnit.id);
                    setActionLog(prev => [`👣 ${selectedUnit.name} пересунувся на [${targetX}, ${targetY}]. Оберіть ціль для атаки або завершіть хід.`, ...prev.slice(0, 15)]);
                } else {
                    setSelectedUnitId(null);
                    setActionLog(prev => [`👣 ${selectedUnit.name} пересунувся на [${targetX}, ${targetY}] (ворогів у зоні ураження немає, хід завершено).`, ...prev.slice(0, 15)]);

                    const readyUnits = updated.filter(u => u.team === 'player' && u.isAlive && !u.hasActed);
                    if (readyUnits.length === 0) {
                        advanceTurn(updated);
                    }
                }
            } else {
                setActionLog(prev => [`❌ Занадто далеко! Дальність руху ${selectedUnit.name}: ${selectedUnit.maxMoveDistance} кл.`, ...prev.slice(0, 15)]);
            }
            return;
        }
    };

    // Handle Quick Recruitment of Starter 16-squad Army
    const handleRecruitStarterArmy = () => {
        const starter = createStarterArmy16Squads();
        const updatedProgress: WorldProgress = {
            ...progress,
            armySquads: starter
        };
        playLevelUpSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
    };

    // Handle Buy 16-squad Legion Box
    const handleBuyLegionBox = () => {
        const cost = 1200;
        if (progress.playerGold < cost) {
            alert('Недостатньо золота! Потрібно 1200 монет для Королівського Легіону.');
            return;
        }

        const legion = createStarterArmy16Squads();
        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold - cost,
            armySquads: [...(progress.armySquads || []), ...legion]
        };
        playGoldSound();
        playLevelUpSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
    };

    // Decompress Squad into Companions: returns exactly squad.soldiersCount companions!
    const handleDecompressSquad = (squad: ArmySquad) => {
        const count = Math.max(1, Math.min(5, squad.soldiersCount));
        setTargetSquad(squad);
        setChoiceModalUnit({
            name: squad.name,
            avatar: squad.avatar,
            level: squad.level,
            experience: squad.experience,
            type: squad.type,
            livingCount: count,
            isSquad: true
        });
    };

    const handleChoiceConfirm = (choice: { classId: string; gender: CharacterGender; name: string; avatar: string }) => {
        if (!targetSquad) return;
        const options: DecompressOptions = {
            chosenClassId: choice.classId,
            chosenGender: choice.gender,
            chosenName: choice.name,
            chosenAvatar: choice.avatar
        };

        const companions = decompressSquadToCompanions(targetSquad, options);
        const remainingSquads = playerSquads.filter(s => s.id !== targetSquad.id);
        const currentCompanions = progress.hiredNpcs || [];
        const currentIds = progress.hiredNpcIds || [];

        const updatedProgress: WorldProgress = {
            ...progress,
            armySquads: remainingSquads,
            hiredNpcs: [...currentCompanions, ...companions],
            hiredNpcIds: [...currentIds, ...companions.map(c => c.id)]
        };

        playLevelUpSound();
        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        setDecompressedCompanions(companions);
        setChoiceModalUnit(null);
        setTargetSquad(null);
    };

    const selectedUnit = units.find(u => u.id === selectedUnitId);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#140e0a] border-2 border-amber-600/60 rounded-3xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-[#f7eedd]"
                >
                    {/* Top Bar Header */}
                    <div className="px-5 py-3 bg-[#1c130d] border-b border-amber-900/50 flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-2xl shadow-inner">
                                🚩
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-black text-amber-300 font-serif flex items-center gap-2">
                                    <span>Битва Армій (16 vs 16 Загонів)</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/70 border border-amber-500/40 text-amber-200">
                                        5 солдатів у загоні • d6 Кидки N проти M
                                    </span>
                                </h2>
                                <p className="text-xs text-stone-400">
                                    {displayTavernName} • Супротивник: <span className="text-amber-200 font-bold">{opponent.name}</span> • Ставка: <span className="text-yellow-400 font-bold">{betAmount} золотих</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Toggle mode button */}
                            <div className="flex bg-stone-900 border border-stone-700 rounded-xl p-0.5 text-xs font-bold">
                                <button
                                    onClick={() => setViewMode('assembly')}
                                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                                        viewMode === 'assembly'
                                            ? 'bg-amber-600 text-black'
                                            : 'text-stone-400 hover:text-white'
                                    }`}
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>Військо ({playerSquads.length}/16)</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (playerSquads.length >= REQUIRED_SQUADS) {
                                            if (units.length === 0) initializeBattle();
                                            setViewMode('battle');
                                        } else {
                                            alert(`Для початку битви необхідно 16 загонів! У вас зараз ${playerSquads.length}/16.`);
                                        }
                                    }}
                                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                                        viewMode === 'battle'
                                            ? 'bg-amber-600 text-black'
                                            : 'text-stone-400 hover:text-white'
                                    } ${playerSquads.length < REQUIRED_SQUADS ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                    <Sword className="w-3.5 h-3.5" />
                                    <span>Поле бою</span>
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 rounded-full transition-colors border border-stone-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* View Mode 1: Assembly / Headquarters View (Inspection, Recruitment & Decompression) */}
                    {viewMode === 'assembly' ? (
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Info Banner */}
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 to-stone-900 border border-amber-600/40 flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1 max-w-xl">
                                    <h3 className="text-base font-black text-amber-300 flex items-center gap-2">
                                        <Flag className="w-4 h-4 text-amber-400" />
                                        <span>Штаб Армії та Загонів Легіону</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${hasEnoughSquads ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-rose-950 text-rose-300 border border-rose-600'}`}>
                                            {playerSquads.length} / {REQUIRED_SQUADS} загонів
                                        </span>
                                    </h3>
                                    <p className="text-xs text-stone-300 leading-relaxed">
                                        Для участі в <span className="text-amber-200 font-bold">Битві Армій</span> необхідно мати <span className="text-amber-300 font-bold">16 загонів по 5 солдатів</span> (разом 80 воїнів).
                                        У битві кількість солдатів у загоні дорівнює кількості кубиків атаки та захисту! Після боїв загони прокачуються, а при декомпресії перетворюються на відповідну кількість живих супутників!
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {playerSquads.length < REQUIRED_SQUADS && (
                                        <>
                                            <button
                                                onClick={handleRecruitStarterArmy}
                                                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-xl text-xs flex items-center gap-2 shadow-lg"
                                            >
                                                <Crown className="w-4 h-4" />
                                                <span>Отримати Набір 16 Загонів</span>
                                            </button>
                                            {onOpenToyShop && (
                                                <button
                                                    onClick={() => {
                                                        onClose();
                                                        onOpenToyShop();
                                                    }}
                                                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-2"
                                                >
                                                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                                                    <span>Магазин Іграшок</span>
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {hasEnoughSquads && (
                                        <button
                                            onClick={initializeBattle}
                                            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 hover:from-amber-400 text-stone-950 font-black rounded-xl text-sm flex items-center gap-2 shadow-xl animate-pulse"
                                        >
                                            <Sword className="w-4 h-4" />
                                            <span>Почати Битву Армій (16 vs 16)</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Decompressed Success Celebratory Notice */}
                            {decompressedCompanions && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/80 to-indigo-950/70 border-2 border-purple-500/70 text-center space-y-2"
                                >
                                    <div className="text-3xl animate-bounce">✨👥</div>
                                    <h4 className="text-base font-black text-yellow-300 font-serif">
                                        Декомпресія успішна: Загін перетворився на {decompressedCompanions.length} повноцінних супутників!
                                    </h4>
                                    <p className="text-xs text-purple-200">
                                        Справжні воїни приєдналися до вашого мандрівного загону та готові до пригод на карті світу!
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                                        {decompressedCompanions.map((comp, idx) => (
                                            <div key={idx} className="p-2 rounded-xl bg-purple-900/40 border border-purple-400/40 text-xs flex items-center gap-2 text-stone-200">
                                                <span className="text-lg">{comp.avatar}</span>
                                                <div className="text-left">
                                                    <div className="font-bold text-amber-300">{comp.name}</div>
                                                    <div className="text-[10px] text-purple-300">{comp.title} • {comp.hp} HP</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setDecompressedCompanions(null)}
                                        className="mt-2 px-3 py-1 bg-purple-800 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                                    >
                                        Чудово!
                                    </button>
                                </motion.div>
                            )}

                            {/* Squad Cards Grid */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs text-stone-400">
                                    <span>Ваші бойові загони ({playerSquads.length}):</span>
                                    <span>Потрібно 16 для вступу в бій</span>
                                </div>

                                {playerSquads.length === 0 ? (
                                    <div className="p-8 text-center rounded-2xl bg-stone-900/50 border border-dashed border-stone-700 space-y-3">
                                        <div className="text-4xl">🏰</div>
                                        <div className="font-bold text-stone-300 text-sm">У вас ще немає армійських загонів</div>
                                        <p className="text-xs text-stone-400 max-w-md mx-auto">
                                            Сформуйте своє перше військо за допомогою безкоштовного набору новобранців або придбайте елітні загони в Магазині Іграшок!
                                        </p>
                                        <button
                                            onClick={handleRecruitStarterArmy}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-xl text-xs"
                                        >
                                            👑 Отримати 16 Стартових Загонів Безкоштовно
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {playerSquads.map((squad, idx) => {
                                            const isReadyToDecompress = (squad.level >= 4 || squad.experience >= 20);
                                            const aliveCount = squad.soldiersCount ?? 5;
                                            return (
                                                <div
                                                    key={squad.id || idx}
                                                    className="p-3.5 rounded-2xl bg-[#18110b] border border-amber-900/40 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-3 shadow-md"
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-2xl p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                                    {squad.avatar}
                                                                </span>
                                                                <div>
                                                                    <div className="font-bold text-xs text-amber-200 line-clamp-1">
                                                                        {squad.name}
                                                                    </div>
                                                                    <div className="text-[10px] text-stone-400 capitalize">
                                                                        Тип: {squad.type}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300">
                                                                Рівень {squad.level}★
                                                            </span>
                                                        </div>

                                                        {/* Living Soldiers Bar */}
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between items-center text-[10px] text-stone-400">
                                                                <span>Живих бійців:</span>
                                                                <span className="font-bold text-amber-300">{aliveCount} / 5</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4, 5].map(slot => (
                                                                    <div
                                                                        key={slot}
                                                                        className={`flex-1 h-2 rounded-full ${
                                                                            slot <= aliveCount
                                                                                ? 'bg-emerald-500 shadow-sm'
                                                                                : 'bg-stone-800'
                                                                        }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* XP & Stats */}
                                                        <div className="text-[10px] text-stone-400 flex justify-between">
                                                            <span>Досвід: <b className="text-yellow-400">{squad.experience || 0} XP</b></span>
                                                            <span>Кубиків: <b className="text-amber-300">{aliveCount}d6</b></span>
                                                        </div>
                                                    </div>

                                                    {/* Decompression Action */}
                                                    {isReadyToDecompress ? (
                                                        <button
                                                            onClick={() => handleDecompressSquad(squad)}
                                                            className="w-full py-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md animate-pulse"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                            <span>Декомпресувати ({aliveCount} компаньйони)</span>
                                                        </button>
                                                    ) : (
                                                        <div className="text-[10px] text-center text-stone-500 italic py-1">
                                                            Декомпресія на 4★ рівні (20+ XP)
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* View Mode 2: Grand Army Battlefield (16x16 Grid) */
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Board Container */}
                            <div className="flex-1 p-2 sm:p-4 flex flex-col items-center justify-center bg-[#0d0906] overflow-auto">
                                <div className="inline-block p-2 bg-[#1c140d] border-2 border-amber-900/50 rounded-2xl shadow-2xl">
                                    <div 
                                        className="grid grid-cols-16 gap-0.5 bg-[#140e09] border border-amber-950 p-1 rounded-xl"
                                        style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
                                    >
                                        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => {
                                            const cIdx = idx % BOARD_SIZE;
                                            const rIdx = Math.floor(idx / BOARD_SIZE);
                                            const unitOnTile = units.find(u => u.isAlive && u.x === cIdx && u.y === rIdx);
                                            const isSelected = selectedUnit && selectedUnit.x === cIdx && selectedUnit.y === rIdx;

                                            // Highlight reachable tiles for selected player unit
                                            const dist = selectedUnit ? getGridDistance(selectedUnit.x, selectedUnit.y, cIdx, rIdx) : 999;
                                            const isReachableMove = selectedUnit && !unitOnTile && dist <= selectedUnit.maxMoveDistance;
                                            const isAttackTarget = selectedUnit && unitOnTile && unitOnTile.team === 'opponent' && dist <= selectedUnit.attackRange;

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleTileClick(cIdx, rIdx)}
                                                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded transition-all cursor-pointer relative select-none ${
                                                        (cIdx + rIdx) % 2 === 0 ? 'bg-[#18110b]' : 'bg-[#120c07]'
                                                    } ${
                                                        isSelected ? 'ring-2 ring-yellow-400 bg-amber-500/20 z-10' : ''
                                                    } ${
                                                        isReachableMove ? 'bg-cyan-600/30 border border-cyan-400/80 animate-pulse' : ''
                                                    } ${
                                                        isAttackTarget ? 'bg-red-600/40 border border-red-500 ring-2 ring-red-500 animate-pulse z-10' : ''
                                                    }`}
                                                >
                                                    {unitOnTile && (
                                                        <div className={`relative flex flex-col items-center justify-center ${unitOnTile.hasActed ? 'opacity-40 grayscale-[40%]' : ''}`}>
                                                            <span className="text-xs sm:text-sm drop-shadow">{unitOnTile.avatar}</span>
                                                            <span className={`text-[8px] font-black px-0.5 rounded leading-tight ${
                                                                unitOnTile.team === 'player'
                                                                    ? 'bg-amber-500 text-black'
                                                                    : 'bg-red-600 text-white'
                                                            }`}>
                                                                {unitOnTile.soldiersCount}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Tactical Legend */}
                                <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-stone-400 mt-2">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
                                        Ваші загони (Жовті, {units.filter(u => u.team === 'player' && u.isAlive).length}/16)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded bg-red-600 inline-block"></span>
                                        Ворожі загони (Червоні, {units.filter(u => u.team === 'opponent' && u.isAlive).length}/16)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded bg-cyan-400 inline-block"></span>
                                        Клітинки ходу
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block"></span>
                                        Ціль атаки
                                    </span>
                                </div>
                            </div>

                            {/* Side Panel: Selected Unit & Combat Log */}
                            <div className="w-full md:w-80 bg-[#16100b] border-t md:border-t-0 md:border-l border-amber-900/50 p-4 flex flex-col justify-between gap-3 text-xs">
                                {/* Selected Unit Info Card */}
                                <div className="space-y-2">
                                    <div className="text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                                        Обраний загін:
                                    </div>

                                    {selectedUnit ? (
                                        <div className="p-3 rounded-2xl bg-[#1d150f] border border-amber-600/40 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-11 h-14 rounded-xl overflow-hidden bg-black/60 border border-amber-600/50 shadow-inner flex-shrink-0">
                                                        <img 
                                                            src={getCompanionSprite({
                                                                name: selectedUnit.name,
                                                                type: selectedUnit.type,
                                                                avatar: selectedUnit.avatar
                                                            })} 
                                                            alt={selectedUnit.name}
                                                            className="w-full h-full object-cover object-top"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-amber-200 flex items-center gap-1">
                                                            <span>{selectedUnit.name}</span>
                                                            <span className="text-xs">{selectedUnit.avatar}</span>
                                                        </div>
                                                        <div className="text-[10px] text-stone-400">Тип: {selectedUnit.type}</div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300">
                                                    {selectedUnit.level}★ Рівень
                                                </span>
                                            </div>

                                            <div className="space-y-1 pt-1 border-t border-stone-800">
                                                <div className="flex justify-between text-stone-300">
                                                    <span>Живих бійців (N кубів):</span>
                                                    <span className="font-bold text-emerald-400">{selectedUnit.soldiersCount} / 5</span>
                                                </div>
                                                <div className="flex justify-between text-stone-300">
                                                    <span>Дальність руху:</span>
                                                    <span className="font-bold text-amber-300">{selectedUnit.maxMoveDistance} кл.</span>
                                                </div>
                                                <div className="flex justify-between text-stone-300">
                                                    <span>Дистанція атаки:</span>
                                                    <span className="font-bold text-amber-300">{selectedUnit.attackRange === 1 ? 'Ближня (1 кл)' : `Дальня (1-${selectedUnit.attackRange} кл)`}</span>
                                                </div>
                                                <div className="flex justify-between text-stone-300">
                                                    <span>Статус ходу:</span>
                                                    <span className={selectedUnit.hasActed ? 'text-stone-500' : selectedUnit.hasMoved ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                                                        {selectedUnit.hasActed ? 'Вже походив' : selectedUnit.hasMoved ? 'Пересунувся (чекає атаки)' : 'Готовий діяти'}
                                                    </span>
                                                </div>
                                                {selectedUnit.team === 'player' && !selectedUnit.hasActed && (
                                                    <button
                                                        onClick={() => {
                                                            const updated = units.map(u => u.id === selectedUnit.id ? { ...u, hasActed: true, hasMoved: true } : u);
                                                            setUnits(updated);
                                                            setSelectedUnitId(null);
                                                            setActionLog(prev => [`🛡️ ${selectedUnit.name} завершив хід.`, ...prev.slice(0, 15)]);
                                                            const readyUnits = updated.filter(u => u.team === 'player' && u.isAlive && !u.hasActed);
                                                            if (readyUnits.length === 0) {
                                                                advanceTurn(updated);
                                                            }
                                                        }}
                                                        className="w-full mt-2 py-1.5 bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500/50 text-amber-200 font-bold rounded-xl text-[11px] transition-colors"
                                                    >
                                                        Завершити хід цього загону
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 text-center rounded-2xl bg-stone-900/40 border border-stone-800 text-stone-400 text-xs italic">
                                            Клікніть на свій загін на полі бою, щоб походити або атакувати
                                        </div>
                                    )}
                                </div>

                                {/* Turn & Pass Action */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-stone-400">Поточний хід:</span>
                                        <span className={`font-black px-2.5 py-0.5 rounded-full ${
                                            currentTurn === 'player'
                                                ? 'bg-amber-950 text-amber-300 border border-amber-600'
                                                : 'bg-red-950 text-red-300 border border-red-600 animate-pulse'
                                        }`}>
                                            {currentTurn === 'player' ? 'Хід Гравця' : 'Хід Супротивника...'}
                                        </span>
                                    </div>

                                    {currentTurn === 'player' ? (
                                        <button
                                            onClick={() => startOpponentTurn(unitsRef.current.length > 0 ? unitsRef.current : units)}
                                            className="w-full py-2 bg-stone-900 hover:bg-stone-800 border border-amber-600/40 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span>Завершити хід гравця</span>
                                        </button>
                                    ) : (
                                        !activeClash && (
                                            <button
                                                onClick={() => {
                                                    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
                                                    setIsAiThinking(false);
                                                    startPlayerTurn(unitsRef.current.length > 0 ? unitsRef.current : units);
                                                }}
                                                className="w-full py-2 bg-gradient-to-r from-amber-900/60 to-yellow-900/60 hover:from-amber-800/80 hover:to-yellow-800/80 border border-amber-500/50 text-amber-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-[0.98]"
                                                title="Передати хід гравцю"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                <span>Передати хід гравцю</span>
                                            </button>
                                        )
                                    )}
                                </div>

                                 {/* Battle Action Log */}
                                <div className="flex-1 min-h-[140px] max-h-[220px] overflow-y-auto p-2.5 rounded-xl bg-[#0e0906] border border-stone-800 space-y-1 font-mono text-[10px]">
                                    <div className="text-stone-500 font-bold uppercase pb-1 border-b border-stone-800">
                                        Хроніка битви:
                                    </div>
                                    {actionLog.map((log, idx) => (
                                        <div key={idx} className="text-stone-300 leading-tight">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Active Clash Modal (Dice Roll Popup): N Attack Dice vs M Defense Dice! */}
                {/* Rendered as top-level overlay so the window and chessboard NEVER jump or move */}
                {activeClash && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 select-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#1c130d] border-2 border-amber-500/80 rounded-3xl p-5 max-w-lg w-full shadow-2xl text-center space-y-4"
                        >
                            <div className="flex justify-between items-center border-b border-amber-900/50 pb-2">
                                <h3 className="text-base font-black text-amber-300 font-serif flex items-center gap-2">
                                    <span>⚔️ Двобій Загонів: Кидок N проти M Кубиків!</span>
                                </h3>
                                <span className="text-[10px] text-stone-400">
                                    d6 Tabletop Wargame
                                </span>
                            </div>

                            {/* Attacker vs Defender Header */}
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#140e0a] border border-stone-800">
                                {/* Attacker (N dice) */}
                                <div className="p-2.5 rounded-2xl bg-amber-950/40 border border-amber-600/40 flex flex-col items-center space-y-1.5">
                                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-black/60 border-2 border-amber-500/60 shadow-lg relative">
                                        <img 
                                            src={getCompanionSprite({
                                                name: activeClash.attacker.name,
                                                type: activeClash.attacker.type,
                                                avatar: activeClash.attacker.avatar
                                            })} 
                                            alt={activeClash.attacker.name}
                                            className="w-full h-full object-cover object-top"
                                        />
                                        <span className="absolute bottom-1 right-1 text-sm drop-shadow">{activeClash.attacker.avatar}</span>
                                    </div>
                                    <div className="font-bold text-xs text-amber-200 truncate max-w-full">{activeClash.attacker.name}</div>
                                    <div className="text-[10px] text-amber-400 font-bold">
                                        Атака: N = {activeClash.attackDiceCount} кубиків d6
                                    </div>
                                    {activeClash.attackerBonus > 0 && (
                                        <div className="text-[9px] text-emerald-400 font-bold">+{activeClash.attackerBonus} бонус атаки</div>
                                    )}
                                </div>

                                {/* Defender (M dice) */}
                                <div className="p-2.5 rounded-2xl bg-blue-950/40 border border-blue-600/40 flex flex-col items-center space-y-1.5">
                                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-black/60 border-2 border-blue-500/60 shadow-lg relative">
                                        <img 
                                            src={getCompanionSprite({
                                                name: activeClash.defender.name,
                                                type: activeClash.defender.type,
                                                avatar: activeClash.defender.avatar
                                            })} 
                                            alt={activeClash.defender.name}
                                            className="w-full h-full object-cover object-top"
                                        />
                                        <span className="absolute bottom-1 right-1 text-sm drop-shadow">{activeClash.defender.avatar}</span>
                                    </div>
                                    <div className="font-bold text-xs text-blue-200 truncate max-w-full">{activeClash.defender.name}</div>
                                    <div className="text-[10px] text-blue-400 font-bold">
                                        Захист: M = {activeClash.defenseDiceCount} кубиків d6
                                    </div>
                                    {activeClash.defenderBonus > 0 && (
                                        <div className="text-[9px] text-emerald-400 font-bold">+{activeClash.defenderBonus} бонус захисту</div>
                                    )}
                                </div>
                            </div>

                            {/* Dice Comparison View */}
                            <div className="space-y-3">
                                <div className="flex justify-around items-center">
                                    {/* Attacker Dice List */}
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-stone-400 font-bold">Кубики Атаки ({activeClash.attackerDice.length}):</div>
                                        <div className="flex gap-1.5 justify-center">
                                            {activeClash.attackerDice.map((val, idx) => (
                                                <div 
                                                    key={idx}
                                                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 text-white font-black text-lg flex items-center justify-center shadow-lg border border-amber-300"
                                                >
                                                    {val}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="text-xl font-black text-stone-500">VS</div>

                                    {/* Defender Dice List */}
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-stone-400 font-bold">Кубики Захисту ({activeClash.defenderDice.length}):</div>
                                        <div className="flex gap-1.5 justify-center">
                                            {activeClash.defenderDice.map((val, idx) => (
                                                <div 
                                                    key={idx}
                                                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-black text-lg flex items-center justify-center shadow-lg border border-blue-300"
                                                >
                                                    {val}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Pairwise Matches Breakdown */}
                                <div className="p-2.5 rounded-xl bg-[#120d09] border border-stone-800 space-y-1.5 text-xs text-left">
                                    <div className="text-[10px] font-bold text-stone-400 uppercase">Результати порівняння:</div>
                                    {activeClash.matches.map((m, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <span>Пара #{m.pairIndex}: Атака <b>{m.attVal}</b> проти Захисту <b>{m.defVal}</b></span>
                                            <span className={`font-black ${m.hit ? 'text-red-400' : 'text-blue-400'}`}>
                                                {m.hit ? '💥 ВЛУЧАННЯ (-1 солдат)' : '🛡️ БЛОК!'}
                                            </span>
                                        </div>
                                    ))}

                                    {activeClash.unmatchedAttackerHits > 0 && (
                                        <div className="text-xs text-amber-300 font-bold border-t border-stone-800 pt-1">
                                            + {activeClash.unmatchedAttackerHits} чисельна перевага (додаткові кидки 5-6)!
                                        </div>
                                    )}
                                </div>

                                {/* Result Summary */}
                                <div className="p-2 rounded-xl bg-amber-950/50 border border-amber-600/40 text-xs font-bold text-amber-200">
                                    {activeClash.totalLosses > 0 ? (
                                        <span>⚔️ Захищаючийся загін зазнав втрат: <b className="text-red-400">-{activeClash.totalLosses} солдатів!</b></span>
                                    ) : (
                                        <span>🛡️ Жоден боєць не постраждав! Оборона вистояла.</span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={applyClashResult}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 text-stone-950 font-black rounded-xl text-sm shadow-xl cursor-pointer"
                            >
                                Застосувати результат та продовжити бій
                            </button>
                        </motion.div>
                    </div>
                )}

                {/* Victory / Defeat Overlay */}
                {battleOutcome !== 'in_progress' && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-4 select-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#1c130d] border-2 border-amber-500 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl"
                        >
                            <div className="text-5xl animate-bounce">
                                {battleOutcome === 'victory' ? '🏆' : '💀'}
                            </div>
                            <h3 className="text-2xl font-black font-serif text-amber-300">
                                {battleOutcome === 'victory' ? 'ВЕЛИЧНА ПЕРЕМОГА АРМІЇ!' : 'ПОРАЗКА ВІЙСЬКА'}
                            </h3>
                            <p className="text-xs text-stone-300">
                                {battleOutcome === 'victory'
                                    ? `Ви розгромили вороже військо ${opponent.name}! Усі вцілілі загони отримали +2 XP до бойового гарту.`
                                    : 'Ваші загони були розбиті в цій битві. Перегрупуйтеся та відновіть сили в таверні!'}
                            </p>

                            {battleOutcome === 'victory' && (
                                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs space-y-1 font-bold text-amber-200">
                                    <div>💰 Золото: +{betAmount * 2 + 150}</div>
                                    <div>⭐ Досвід героя: +200 XP</div>
                                    <div>🎖️ Ветеранство: +2 XP усім уцілілим загонам</div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setBattleOutcome('in_progress');
                                        setViewMode('assembly');
                                    }}
                                    className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold rounded-xl text-xs border border-stone-700 cursor-pointer"
                                >
                                    До штабу армії
                                </button>
                                <button
                                    onClick={() => {
                                        if (battleOutcome === 'victory') {
                                            onVictory?.(progress);
                                        } else if (battleOutcome === 'defeat') {
                                            onDefeat?.(progress);
                                        } else {
                                            onClose();
                                        }
                                    }}
                                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-xl text-xs shadow-lg cursor-pointer"
                                >
                                    Завершити
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Class & Gender Choice Modal */}
                <DecompressChoiceModal
                    isOpen={!!choiceModalUnit}
                    onClose={() => {
                        setChoiceModalUnit(null);
                        setTargetSquad(null);
                    }}
                    unit={choiceModalUnit}
                    onConfirm={handleChoiceConfirm}
                />
            </div>
        </AnimatePresence>
    );
}

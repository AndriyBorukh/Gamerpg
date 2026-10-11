import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData, TavernData, SettlementData, WorldProgress, ToySoldier } from '../types';
import { ToySoldierFigurine } from './ToySoldierFigurine';
import { 
    getSoldierMaxHp, 
    getSoldierBaseHp,
    getSoldierAttackBonus, 
    getSoldierDefenseBonus, 
    getSoldierBaseDefenseBonus,
    getSoldierAttackModifier,
    getSoldierMaxMoveDistance,
    normalizeSoldierType,
    getGridDistance, 
    getRangeAttackModifier, 
    calculateSoldierLevel,
    DEFAULT_STARTER_TOY_SOLDIERS 
} from '../lib/toySoldiersData';
import { saveWorldProgress } from '../lib/worldData';
import { getFigurineRequirement, executeAutoPurchaseForActivity } from '../lib/toyAutoPurchase';
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
    Zap, 
    Plus,
    Flame
} from 'lucide-react';

const BOARD_SIZE = 15;

interface BattleUnit {
    unitId: string;
    team: 'player' | 'opponent';
    name: string;
    avatar: string;
    type: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    potionsLeft: number;
    magicChargesLeft: number;
    healChargesLeft: number;
    bombChargesLeft: number;
    holyChargesLeft: number;
    level: number;
    atkBonus: number;
    defBonus: number;
    maxMoveDistance: number;
    soldierRef?: ToySoldier;
    hasActed: boolean;
    isAlive: boolean;
}

interface ToySoldiersModalProps {
    isOpen: boolean;
    onClose: () => void;
    opponent: OpponentData;
    tavern?: TavernData;
    tavernName?: string;
    settlement?: SettlementData;
    progress: WorldProgress;
    betAmount?: number;
    onUpdateProgress: (newProgress: WorldProgress) => void;
    onVictory?: () => void;
    onDefeat?: () => void;
    onOpenShop?: () => void;
    onOpenDecompression?: () => void;
    onOpenToyShop?: () => void;
    onOpenDecompressionMaster?: () => void;
}

type CombatPhase = 'ready_attack' | 'ready_defend' | 'clash_resolved';

export function ToySoldiersModal({
    isOpen,
    onClose,
    opponent,
    tavern,
    tavernName,
    settlement,
    progress,
    betAmount = 10,
    onUpdateProgress,
    onVictory,
    onDefeat,
    onOpenShop,
    onOpenDecompression,
    onOpenToyShop,
    onOpenDecompressionMaster
}: ToySoldiersModalProps) {
    const handleOpenShop = onOpenShop || onOpenToyShop || (() => {});
    const handleOpenDecomp = onOpenDecompression || onOpenDecompressionMaster || (() => {});
    const displayTavernName = tavernName || tavern?.name || 'Таверна';
    const playerSoldiers: ToySoldier[] = (progress.toySoldiers || []).filter(s => (s.deaths || 0) < 3);
    const hasEnoughSoldiers = playerSoldiers.length >= 5;

    // Game states
    const [units, setUnits] = useState<BattleUnit[]>([]);
    const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent'>('player');
    const [roundNumber, setRoundNumber] = useState<number>(1);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [actionLog, setActionLog] = useState<string[]>([]);
    const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
    const [useMageCharge, setUseMageCharge] = useState<boolean>(false);
    const [useBombCharge, setUseBombCharge] = useState<boolean>(false);
    const [isSelectingHealTarget, setIsSelectingHealTarget] = useState<boolean>(false);

    // Dice duel modal overlay state for combat
    const [activeCombat, setActiveCombat] = useState<{
        attacker: BattleUnit;
        defender: BattleUnit;
        distance: number;
        rangePenalty: number;
        phase: CombatPhase;
        attackRoll: number | null;
        defenseRoll: number | null;
        attackBonus: number;
        defenseBonus: number;
        finalAttack: number | null;
        finalDefense: number | null;
        hitSuccess: boolean | null;
        rollingEntity: 'attacker' | 'defender' | null;
    } | null>(null);

    // End game resolution
    const [battleResult, setBattleResult] = useState<{
        winner: 'player' | 'opponent';
        xpGained: { soldierId: string; name: string; leveledUp: boolean; newLevel: number }[];
        brokenSoldiers: { soldierId: string; name: string }[];
        damagedSoldiers: { soldierId: string; name: string; currentDeaths: number }[];
        goldWon: number;
    } | null>(null);

    // Initialize battle board
    const initializeGame = () => {
        // Select soldiers from player collection, fill missing with starter recruits
        const owned = [...playerSoldiers];
        const playerTeamSoldiers: ToySoldier[] = [];
        for (let i = 0; i < 5; i++) {
            if (i < owned.length) {
                playerTeamSoldiers.push(owned[i]);
            } else {
                playerTeamSoldiers.push(DEFAULT_STARTER_TOY_SOLDIERS[i] || {
                    id: `default_soldier_${i}`,
                    name: `Олов'яний рекрут #${i + 1}`,
                    avatar: '⚔️',
                    level: 0,
                    experience: 0,
                    deaths: 0,
                    maxHp: 3,
                    type: 'піхотинець'
                });
            }
        }

        // Player units at bottom rows (row 13-14)
        const initialPlayerUnits: BattleUnit[] = playerTeamSoldiers.map((s, idx) => {
            const unitType = s.type || 'піхотинець';
            const normType = normalizeSoldierType(unitType);
            const maxHp = getSoldierMaxHp(s);
            const moveDist = getSoldierMaxMoveDistance(unitType);
            const xCoords = [2, 5, 7, 9, 12];
            const yCoords = [14, 13, 14, 13, 14];

            return {
                unitId: `p_${s.id}_${idx}`,
                team: 'player',
                name: s.name,
                avatar: s.avatar,
                type: unitType,
                x: xCoords[idx] ?? (idx * 2 + 3),
                y: yCoords[idx] ?? 14,
                hp: maxHp,
                maxHp: maxHp,
                potionsLeft: 1,
                magicChargesLeft: normType === 'маг' ? 1 : 0,
                healChargesLeft: normType === 'клірик' ? 1 : 0,
                bombChargesLeft: normType === 'алхімік' ? 1 : 0,
                holyChargesLeft: normType === 'паладин' ? 1 : 0,
                level: s.level,
                atkBonus: getSoldierAttackBonus(s),
                defBonus: getSoldierDefenseBonus(s),
                maxMoveDistance: moveDist,
                soldierRef: s,
                hasActed: false,
                isAlive: true
            };
        });

        // Opponent units at top rows (row 0-1)
        const oppName = opponent?.name || 'Супротивник';
        const opponentTemplates = [
            { name: `${oppName} (Олов'яний піхотинець)`, avatar: '⚔️', type: 'піхотинець' },
            { name: `${oppName} (Дерев'яний стрілець)`, avatar: '🏹', type: 'стрілець' },
            { name: `${oppName} (Бронзовий щитоносець)`, avatar: '🛡️', type: 'щитоносець' },
            { name: `${oppName} (Залізний лицар)`, avatar: '🤺', type: 'важкий_лицар' },
            { name: `${oppName} (Королівський гвардієць)`, avatar: '💂‍♂️', type: 'гвардієць' },
            { name: `${oppName} (Лютий берсерк)`, avatar: '🪓', type: 'берсерк' },
            { name: `${oppName} (Олов'яний маг)`, avatar: '🧙‍♂️', type: 'маг' },
            { name: `${oppName} (Целитель-клірик)`, avatar: '📿', type: 'клірик' },
            { name: `${oppName} (Олов'яний вершник)`, avatar: '🐎', type: 'вершник' },
            { name: `${oppName} (Важкий арбалетник)`, avatar: '🎯', type: 'арбалетник' },
            { name: `${oppName} (Тіньовий асасин)`, avatar: '🥷', type: 'асасин' },
            { name: `${oppName} (Запальний алхімік)`, avatar: '💣', type: 'алхімік' },
            { name: `${oppName} (Священний паладин)`, avatar: '⚜️', type: 'паладин' }
        ];

        // Pick 5 distinct templates for opponent
        const selectedOpponentTemplates = [...opponentTemplates].sort(() => Math.random() - 0.5).slice(0, 5);

        const initialOpponentUnits: BattleUnit[] = selectedOpponentTemplates.map((t, idx) => {
            const unitType = t.type;
            const normType = normalizeSoldierType(unitType);
            const baseHp = getSoldierBaseHp(unitType);
            const baseDef = getSoldierBaseDefenseBonus(unitType);
            const moveDist = getSoldierMaxMoveDistance(unitType);
            const xCoords = [2, 5, 7, 9, 12];
            const yCoords = [0, 1, 0, 1, 0];

            return {
                unitId: `opp_${idx}`,
                team: 'opponent',
                name: t.name,
                avatar: t.avatar,
                type: unitType,
                x: xCoords[idx] ?? (idx * 2 + 3),
                y: yCoords[idx] ?? 0,
                hp: baseHp,
                maxHp: baseHp,
                potionsLeft: 1,
                magicChargesLeft: normType === 'маг' ? 1 : 0,
                healChargesLeft: normType === 'клірик' ? 1 : 0,
                bombChargesLeft: normType === 'алхімік' ? 1 : 0,
                holyChargesLeft: normType === 'паладин' ? 1 : 0,
                level: opponent.rank > 2 ? 1 : 0,
                atkBonus: opponent.rank > 2 ? 1 : 0,
                defBonus: baseDef + (opponent.rank > 3 ? 1 : 0),
                maxMoveDistance: moveDist,
                hasActed: false,
                isAlive: true
            };
        });

        setUnits([...initialPlayerUnits, ...initialOpponentUnits]);
        setCurrentTurn('player');
        setRoundNumber(1);
        setSelectedUnitId(initialPlayerUnits[0]?.unitId || null);
        setUseMageCharge(false);
        setIsSelectingHealTarget(false);
        setActionLog([`Бій розпочато! Виставили по 5 солдатиків на дошці 15x15.`]);
        setBattleResult(null);
        setActiveCombat(null);
    };

    useEffect(() => {
        if (isOpen) {
            initializeGame();
        }
    }, [isOpen]);

    // Helpers
    const getUnitAt = (x: number, y: number) => {
        return units.find(u => u.isAlive && u.x === x && u.y === y);
    };

    const selectedUnit = units.find(u => u.unitId === selectedUnitId && u.isAlive);

    // Calculate valid moves based on unit's maxMoveDistance (8 for Horseman/Cavalry, 6 for Knight, 4 for others)
    const getValidMoves = (unit: BattleUnit): { x: number; y: number }[] => {
        const moves: { x: number; y: number }[] = [];
        const maxDist = unit.maxMoveDistance || 4;
        for (let dx = -maxDist; dx <= maxDist; dx++) {
            for (let dy = -maxDist; dy <= maxDist; dy++) {
                if (dx === 0 && dy === 0) continue;
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                if (dist <= maxDist) {
                    const nx = unit.x + dx;
                    const ny = unit.y + dy;
                    if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                        if (!getUnitAt(nx, ny)) {
                            moves.push({ x: nx, y: ny });
                        }
                    }
                }
            }
        }
        return moves;
    };

    // Calculate valid attack targets taking into account unit attack types and distance penalties
    const getValidAttackTargets = (unit: BattleUnit): BattleUnit[] => {
        const targetTeam = unit.team === 'player' ? 'opponent' : 'player';
        return units.filter(u => {
            if (!u.isAlive || u.team !== targetTeam) return false;
            const dist = getGridDistance(unit.x, unit.y, u.x, u.y);
            if (dist < 1 || dist > 3) return false;
            const mod = getSoldierAttackModifier(unit.type, dist);
            return mod !== null;
        });
    };

    // Calculate valid heal targets for Cleric
    const getValidHealTargets = (cleric: BattleUnit): BattleUnit[] => {
        if (cleric.healChargesLeft <= 0) return [];
        return units.filter(u => {
            if (!u.isAlive || u.team !== cleric.team) return false;
            if (u.hp >= u.maxHp) return false;
            const dist = getGridDistance(cleric.x, cleric.y, u.x, u.y);
            return dist >= 1 && dist <= 3;
        });
    };

    // Cleric heal action
    const handleHealAlly = (targetAlly: BattleUnit) => {
        if (!selectedUnit || selectedUnit.team !== 'player' || currentTurn !== 'player' || selectedUnit.hasActed) return;
        if (selectedUnit.healChargesLeft <= 0) return;

        setUnits(prev => prev.map(u => {
            if (u.unitId === targetAlly.unitId) {
                return { ...u, hp: Math.min(u.maxHp, u.hp + 1) };
            }
            if (u.unitId === selectedUnit.unitId) {
                return { ...u, healChargesLeft: 0, hasActed: true };
            }
            return u;
        }));

        playLevelUpSound();
        setIsSelectingHealTarget(false);
        setActionLog(prev => [`⚕️ ${selectedUnit.name} зцілив ${targetAlly.name} (+1 HP). Хід переходить до супротивника.`, ...prev.slice(0, 15)]);
        setTimeout(() => {
            passTurnToOpponent();
        }, 300);
    };

    // Turn switching helpers
    const passTurnToOpponent = () => {
        setCurrentTurn('opponent');
        runAiTurn();
    };

    const passTurnToPlayer = () => {
        setCurrentTurn('player');
        setUnits(prev => {
            const livingPlayers = prev.filter(u => u.team === 'player' && u.isAlive && u.hp > 0);
            const unacted = livingPlayers.filter(u => !u.hasActed);
            if (unacted.length === 0) {
                setRoundNumber(r => r + 1);
                return prev.map(u => u.team === 'player' ? { ...u, hasActed: false } : u);
            }
            return prev;
        });
    };

    // Auto-select living unacted player unit when turn becomes 'player'
    useEffect(() => {
        if (currentTurn === 'player') {
            const livingUnacted = units.filter(u => u.team === 'player' && u.isAlive && u.hp > 0 && !u.hasActed);
            if (livingUnacted.length > 0) {
                if (!selectedUnitId || !livingUnacted.some(u => u.unitId === selectedUnitId)) {
                    setSelectedUnitId(livingUnacted[0].unitId);
                }
            } else {
                const livingPlayer = units.filter(u => u.team === 'player' && u.isAlive && u.hp > 0);
                if (livingPlayer.length > 0 && (!selectedUnitId || !livingPlayer.some(u => u.unitId === selectedUnitId))) {
                    setSelectedUnitId(livingPlayer[0].unitId);
                }
            }
        }
    }, [currentTurn]);

    // Move selected unit
    const handleMoveUnit = (targetX: number, targetY: number) => {
        if (!selectedUnit || selectedUnit.team !== 'player' || currentTurn !== 'player' || selectedUnit.hasActed) return;

        const validMoves = getValidMoves(selectedUnit);
        const isValid = validMoves.some(m => m.x === targetX && m.y === targetY);
        if (!isValid) return;

        // Update unit position
        setUnits(prev => prev.map(u => {
            if (u.unitId === selectedUnit.unitId) {
                return { ...u, x: targetX, y: targetY };
            }
            return u;
        }));

        // Check if there are enemies in range 1..3 from new position
        const livingOpponents = units.filter(u => u.team === 'opponent' && u.isAlive && u.hp > 0);
        const hasTargetsInRange = livingOpponents.some(enemy => {
            const d = getGridDistance(targetX, targetY, enemy.x, enemy.y);
            return d >= 1 && d <= 3;
        });

        if (hasTargetsInRange) {
            setActionLog(prev => [
                `👣 ${selectedUnit.name} перемістився на (${targetX + 1}, ${targetY + 1}). Атакуйте ворога в межах 3х клітинок або закінчіть хід.`,
                ...prev.slice(0, 15)
            ]);
        } else {
            // No enemies in range; finish unit action and pass turn
            setUnits(prev => prev.map(u => u.unitId === selectedUnit.unitId ? { ...u, hasActed: true } : u));
            setActionLog(prev => [
                `👣 ${selectedUnit.name} перемістився на (${targetX + 1}, ${targetY + 1}). Ворогів поруч немає — хід переходить супротивнику.`,
                ...prev.slice(0, 15)
            ]);
            setTimeout(() => {
                passTurnToOpponent();
            }, 300);
        }
    };

    // Initiate combat against a target
    const handleInitiateCombat = (target: BattleUnit) => {
        if (!selectedUnit || selectedUnit.team !== 'player' || currentTurn !== 'player' || selectedUnit.hasActed) return;

        const distance = getGridDistance(selectedUnit.x, selectedUnit.y, target.x, target.y);
        const basePenalty = getSoldierAttackModifier(selectedUnit.type, distance);
        if (basePenalty === null) {
            setActionLog(prev => [`🚫 ${selectedUnit.name} не має дальньої атаки на відстані ${distance} кл!`, ...prev.slice(0, 15)]);
            return;
        }

        let extraAtk = 0;
        if (useMageCharge && selectedUnit.magicChargesLeft > 0) {
            extraAtk = 1;
            setUnits(prev => prev.map(u => u.unitId === selectedUnit.unitId ? { ...u, magicChargesLeft: u.magicChargesLeft - 1 } : u));
            setUseMageCharge(false);
            setActionLog(prev => [`✨ ${selectedUnit.name} застосував Магічний заряд (+1 к атаці)!`, ...prev.slice(0, 15)]);
        } else if (useBombCharge && selectedUnit.bombChargesLeft > 0) {
            extraAtk = 1;
            setUnits(prev => prev.map(u => u.unitId === selectedUnit.unitId ? { ...u, bombChargesLeft: u.bombChargesLeft - 1 } : u));
            setUseBombCharge(false);
            setActionLog(prev => [`💣 ${selectedUnit.name} кинув Вибухову бомбу (+1 к атаці)!`, ...prev.slice(0, 15)]);
        }

        setActiveCombat({
            attacker: selectedUnit,
            defender: target,
            distance,
            rangePenalty: basePenalty + extraAtk,
            phase: 'ready_attack',
            attackRoll: null,
            defenseRoll: null,
            attackBonus: selectedUnit.atkBonus,
            defenseBonus: target.defBonus,
            finalAttack: null,
            finalDefense: null,
            hitSuccess: null,
            rollingEntity: null
        });
    };

    // Drink health potion (+1 HP, uses turn)
    const handleDrinkPotion = () => {
        if (!selectedUnit || selectedUnit.team !== 'player' || currentTurn !== 'player' || selectedUnit.hasActed) return;
        if (selectedUnit.potionsLeft <= 0) return;
        if (selectedUnit.hp >= selectedUnit.maxHp) return;

        setUnits(prev => prev.map(u => {
            if (u.unitId === selectedUnit.unitId) {
                return {
                    ...u,
                    hp: Math.min(u.maxHp, u.hp + 1),
                    potionsLeft: u.potionsLeft - 1,
                    hasActed: true
                };
            }
            return u;
        }));

        playLevelUpSound();
        setActionLog(prev => [`🧪 ${selectedUnit.name} випив зілля здоров'я (+1 HP). Хід переходить до супротивника.`, ...prev.slice(0, 15)]);
        setTimeout(() => {
            passTurnToOpponent();
        }, 300);
    };

    // Finish action of current unit
    const handleFinishUnitAction = () => {
        if (!selectedUnit) return;
        setUnits(prev => prev.map(u => u.unitId === selectedUnit.unitId ? { ...u, hasActed: true } : u));
        setActionLog(prev => [`⏹️ ${selectedUnit.name} завершив хід. Хід переходить до супротивника.`, ...prev.slice(0, 15)]);
        setTimeout(() => {
            passTurnToOpponent();
        }, 200);
    };

    // Sequential dice roll: Step 1 Attacker
    const handleRollAttack = () => {
        if (!activeCombat || activeCombat.phase !== 'ready_attack' || activeCombat.rollingEntity) return;

        setActiveCombat(prev => prev ? { ...prev, rollingEntity: 'attacker' } : null);
        playDiceRollSound();

        setTimeout(() => {
            const rawRoll = Math.floor(Math.random() * 20) + 1;
            const finalScore = rawRoll + activeCombat.attackBonus + activeCombat.rangePenalty;

            setActiveCombat(prev => prev ? {
                ...prev,
                attackRoll: rawRoll,
                finalAttack: finalScore,
                phase: 'ready_defend',
                rollingEntity: null
            } : null);

            // Auto-trigger defender roll after short delay if opponent is defending
            if (activeCombat.defender.team === 'opponent') {
                setTimeout(() => {
                    handleRollDefenseForOpponent(rawRoll, finalScore);
                }, 700);
            }
        }, 800);
    };

    // Sequential dice roll: Step 2 Defender (Opponent)
    const handleRollDefenseForOpponent = (rawAtk: number, finalAtk: number) => {
        if (!activeCombat) return;
        setActiveCombat(prev => prev ? { ...prev, rollingEntity: 'defender' } : null);
        playDiceRollSound();

        setTimeout(() => {
            const rawDef = Math.floor(Math.random() * 20) + 1;
            const finalDef = rawDef + activeCombat.defenseBonus;
            const hit = finalAtk > finalDef;

            if (hit) {
                playSwordClashSound();
            } else {
                playShieldBlockSound();
            }

            setActiveCombat(prev => prev ? {
                ...prev,
                defenseRoll: rawDef,
                finalDefense: finalDef,
                phase: 'clash_resolved',
                hitSuccess: hit,
                rollingEntity: null
            } : null);
        }, 800);
    };

    // Sequential dice roll: Step 2 Defender (Player)
    const handleRollDefenseForPlayer = () => {
        if (!activeCombat || activeCombat.phase !== 'ready_defend' || activeCombat.rollingEntity) return;

        setActiveCombat(prev => prev ? { ...prev, rollingEntity: 'defender' } : null);
        playDiceRollSound();

        setTimeout(() => {
            const rawDef = Math.floor(Math.random() * 20) + 1;
            const finalDef = rawDef + activeCombat.defenseBonus;
            const finalAtk = activeCombat.finalAttack ?? 0;
            const hit = finalAtk > finalDef;

            if (hit) {
                playSwordClashSound();
            } else {
                playShieldBlockSound();
            }

            setActiveCombat(prev => prev ? {
                ...prev,
                defenseRoll: rawDef,
                finalDefense: finalDef,
                phase: 'clash_resolved',
                hitSuccess: hit,
                rollingEntity: null
            } : null);
        }, 800);
    };

    // Apply combat outcome and close combat overlay
    const handleApplyCombatOutcome = () => {
        if (!activeCombat || activeCombat.hitSuccess === null) return;

        const { attacker, defender, hitSuccess, finalAttack, finalDefense } = activeCombat;

        let defenderDied = false;
        setUnits(prev => prev.map(u => {
            if (u.unitId === defender.unitId) {
                const newHp = hitSuccess ? u.hp - 1 : u.hp;
                if (newHp <= 0) {
                    defenderDied = true;
                    return { ...u, hp: 0, isAlive: false };
                }
                return { ...u, hp: newHp };
            }
            if (u.unitId === attacker.unitId) {
                return { ...u, hasActed: true };
            }
            return u;
        }));

        if (hitSuccess) {
            setActionLog(prev => [
                `⚔️ ${attacker.name} атакував ${defender.name} (Атака ${finalAttack} > Захист ${finalDefense}) і наніс 1 шкоди! ${defenderDied ? '💀 Солдатик побитий і вибув!' : ''}`,
                ...prev.slice(0, 15)
            ]);
        } else {
            setActionLog(prev => [
                `🛡️ ${defender.name} успішно захистився від ${attacker.name} (Атака ${finalAttack} <= Захист ${finalDefense})!`,
                ...prev.slice(0, 15)
            ]);
        }

        const wasPlayerAttacker = attacker.team === 'player';
        setActiveCombat(null);

        setTimeout(() => {
            // Check game end conditions
            const livingPlayerUnits = units.filter(u => u.team === 'player' && u.isAlive && u.hp > 0);
            const livingOpponentUnits = units.filter(u => u.team === 'opponent' && u.isAlive && u.hp > 0);

            if (livingPlayerUnits.length === 0) {
                handleMatchEnd('opponent');
                return;
            }
            if (livingOpponentUnits.length === 0) {
                handleMatchEnd('player');
                return;
            }

            if (wasPlayerAttacker) {
                passTurnToOpponent();
            } else {
                passTurnToPlayer();
            }
        }, 300);
    };

    // End player turn manually
    const handleEndPlayerTurn = () => {
        if (currentTurn !== 'player') return;
        if (selectedUnit) {
            setUnits(prev => prev.map(u => u.unitId === selectedUnit.unitId ? { ...u, hasActed: true } : u));
        }
        setActionLog(prev => [`⏩ Хід передано супротивнику.`, ...prev.slice(0, 15)]);
        passTurnToOpponent();
    };

    // AI Turn Execution - 1 AI unit per turn
    const runAiTurn = () => {
        setIsAiThinking(true);

        setTimeout(() => {
            const livingOpponents = units.filter(u => u.team === 'opponent' && u.isAlive && u.hp > 0);
            const livingPlayers = units.filter(u => u.team === 'player' && u.isAlive && u.hp > 0);

            if (livingOpponents.length === 0) {
                handleMatchEnd('player');
                setIsAiThinking(false);
                return;
            }
            if (livingPlayers.length === 0) {
                handleMatchEnd('opponent');
                setIsAiThinking(false);
                return;
            }

            // Find an AI unit that hasn't acted yet
            let unactedOpponents = livingOpponents.filter(u => !u.hasActed);
            if (unactedOpponents.length === 0) {
                // All AI units acted in this cycle; reset hasActed flags
                setUnits(prev => prev.map(u => u.team === 'opponent' ? { ...u, hasActed: false } : u));
                unactedOpponents = livingOpponents;
            }

            const aiUnit = unactedOpponents[0];
            if (!aiUnit) {
                setIsAiThinking(false);
                passTurnToPlayer();
                return;
            }

            const normType = normalizeSoldierType(aiUnit.type);

            // 1. Cleric Healing check
            if (normType === 'клірик' && aiUnit.healChargesLeft > 0) {
                const damagedAlly = livingOpponents.find(u => u.unitId !== aiUnit.unitId && u.hp < u.maxHp && getGridDistance(aiUnit.x, aiUnit.y, u.x, u.y) <= 3);
                if (damagedAlly) {
                    setUnits(prev => prev.map(u => {
                        if (u.unitId === damagedAlly.unitId) return { ...u, hp: Math.min(u.maxHp, u.hp + 1) };
                        if (u.unitId === aiUnit.unitId) return { ...u, healChargesLeft: 0, hasActed: true };
                        return u;
                    }));
                    playLevelUpSound();
                    setActionLog(prev => [`⚕️ ${aiUnit.name} (Клірик) зцілив ${damagedAlly.name} (+1 HP). Хід переходить до вас!`, ...prev.slice(0, 15)]);
                    setIsAiThinking(false);
                    passTurnToPlayer();
                    return;
                }
            }

            // 2. Low HP Potion check
            if (aiUnit.hp <= 1 && aiUnit.potionsLeft > 0) {
                setUnits(prev => prev.map(u => {
                    if (u.unitId === aiUnit.unitId) {
                        return { ...u, hp: u.hp + 1, potionsLeft: u.potionsLeft - 1, hasActed: true };
                    }
                    return u;
                }));
                setActionLog(prev => [`🧪 ${aiUnit.name} випив зілля здоров'я (+1 HP). Хід переходить до вас!`, ...prev.slice(0, 15)]);
                setIsAiThinking(false);
                passTurnToPlayer();
                return;
            }

            // 3. Find nearest player unit
            let nearestPlayer: BattleUnit | null = null;
            let minDistance = 999;
            for (const p of livingPlayers) {
                const d = getGridDistance(aiUnit.x, aiUnit.y, p.x, p.y);
                if (d < minDistance) {
                    minDistance = d;
                    nearestPlayer = p;
                }
            }

            if (!nearestPlayer) {
                setIsAiThinking(false);
                passTurnToPlayer();
                return;
            }

            // 4. Move closer if out of range or cannot attack
            const canAttackFromCurrent = getSoldierAttackModifier(aiUnit.type, minDistance) !== null;

            let currentX = aiUnit.x;
            let currentY = aiUnit.y;

            if (!canAttackFromCurrent || minDistance > 3) {
                const dirX = Math.sign(nearestPlayer.x - aiUnit.x);
                const dirY = Math.sign(nearestPlayer.y - aiUnit.y);
                const maxStep = aiUnit.maxMoveDistance || 4;

                let newX = Math.min(BOARD_SIZE - 1, Math.max(0, aiUnit.x + dirX * maxStep));
                let newY = Math.min(BOARD_SIZE - 1, Math.max(0, aiUnit.y + dirY * maxStep));

                // Collision check
                if (units.some(u => u.isAlive && u.unitId !== aiUnit.unitId && u.x === newX && u.y === newY)) {
                    newX = Math.min(BOARD_SIZE - 1, Math.max(0, aiUnit.x + dirX));
                    newY = Math.min(BOARD_SIZE - 1, Math.max(0, aiUnit.y + dirY));
                }

                if (!units.some(u => u.isAlive && u.unitId !== aiUnit.unitId && u.x === newX && u.y === newY)) {
                    currentX = newX;
                    currentY = newY;
                }
            }

            const newDist = getGridDistance(currentX, currentY, nearestPlayer.x, nearestPlayer.y);
            const attackModAfterMove = getSoldierAttackModifier(aiUnit.type, newDist);

            let magicChargeUsed = false;
            let aiMagicChargesLeft = aiUnit.magicChargesLeft;
            let extraAtk = 0;

            if (attackModAfterMove !== null && normType === 'маг' && aiMagicChargesLeft > 0) {
                extraAtk = 1;
                aiMagicChargesLeft = 0;
                magicChargeUsed = true;
            }

            // Update unit position & hasActed status
            setUnits(prev => prev.map(u => {
                if (u.unitId === aiUnit.unitId) {
                    return {
                        ...u,
                        x: currentX,
                        y: currentY,
                        magicChargesLeft: aiMagicChargesLeft,
                        hasActed: true
                    };
                }
                return u;
            }));

            // 5. If can attack after movement, execute attack
            if (attackModAfterMove !== null) {
                const totalPenalty = attackModAfterMove + extraAtk;
                setActionLog(prev => [
                    `⚔️ ${aiUnit.name} нападає на ${nearestPlayer!.name}${magicChargeUsed ? ' з Магічним зарядом (+1)' : ''}! Клікнути кидок захисту.`,
                    ...prev.slice(0, 15)
                ]);

                setActiveCombat({
                    attacker: { ...aiUnit, x: currentX, y: currentY },
                    defender: nearestPlayer,
                    distance: newDist,
                    rangePenalty: totalPenalty,
                    phase: 'ready_attack',
                    attackRoll: null,
                    defenseRoll: null,
                    attackBonus: aiUnit.atkBonus,
                    defenseBonus: nearestPlayer.defBonus,
                    finalAttack: null,
                    finalDefense: null,
                    hitSuccess: null,
                    rollingEntity: null
                });

                // Roll AI attack automatically
                setTimeout(() => {
                    const rawAtk = Math.floor(Math.random() * 20) + 1;
                    const finalAtk = rawAtk + aiUnit.atkBonus + totalPenalty;
                    setActiveCombat(prev => prev ? {
                        ...prev,
                        attackRoll: rawAtk,
                        finalAttack: finalAtk,
                        phase: 'ready_defend'
                    } : null);
                }, 500);

                setIsAiThinking(false);
            } else {
                // Just moved closer
                setActionLog(prev => [`👣 ${aiUnit.name} перемістився на (${currentX + 1}, ${currentY + 1}). Хід переходить до вас!`, ...prev.slice(0, 15)]);
                setIsAiThinking(false);
                passTurnToPlayer();
            }
        }, 800);
    };

    // Match End handling
    const handleMatchEnd = (winner: 'player' | 'opponent') => {
        const xpGainedList: { soldierId: string; name: string; leveledUp: boolean; newLevel: number }[] = [];
        const brokenList: { soldierId: string; name: string }[] = [];
        const damagedList: { soldierId: string; name: string; currentDeaths: number }[] = [];

        const allPlayerCollection = [...(progress.toySoldiers || [])];

        // Update player soldiers
        const updatedSoldiers = allPlayerCollection.map(soldier => {
            const battleUnit = units.find(u => u.soldierRef?.id === soldier.id);
            if (!battleUnit) return soldier;

            let updatedDeaths = soldier.deaths;
            let updatedXp = soldier.experience;
            let updatedLevel = soldier.level;

            if (!battleUnit.isAlive) {
                // Beaten soldier
                updatedDeaths += 1;
                if (updatedDeaths >= 4) {
                    brokenList.push({ soldierId: soldier.id, name: soldier.name });
                } else {
                    damagedList.push({ soldierId: soldier.id, name: soldier.name, currentDeaths: updatedDeaths });
                }
            } else if (winner === 'player') {
                // Unbeaten soldier in victory: gains +1 XP!
                updatedXp += 1;
                const newCalculatedLevel = calculateSoldierLevel(updatedXp);
                const didLevelUp = newCalculatedLevel > updatedLevel;
                updatedLevel = newCalculatedLevel;

                xpGainedList.push({
                    soldierId: soldier.id,
                    name: soldier.name,
                    leveledUp: didLevelUp,
                    newLevel: updatedLevel
                });
            }

            return {
                ...soldier,
                experience: updatedXp,
                level: updatedLevel,
                deaths: updatedDeaths,
                maxHp: updatedLevel >= 3 ? 4 : 3
            };
        });

        // Filter out broken soldiers if desired or keep with deaths=4
        const goldPrize = winner === 'player' ? Math.max(30, betAmount * 2) : 0;
        const repGain = winner === 'player' ? 10 : 0;

        const updatedProgress: WorldProgress = {
            ...progress,
            playerGold: progress.playerGold + goldPrize,
            playerReputation: progress.playerReputation + repGain,
            toySoldiers: updatedSoldiers
        };

        if (winner === 'player') {
            playVictorySound();
            playGoldSound();
        } else {
            playDefeatSound();
        }

        onUpdateProgress(updatedProgress);
        saveWorldProgress(updatedProgress);

        setBattleResult({
            winner,
            xpGained: xpGainedList,
            brokenSoldiers: brokenList,
            damagedSoldiers: damagedList,
            goldWon: goldPrize
        });
    };

    if (!isOpen) return null;

    if (!hasEnoughSoldiers) {
        const missingCount = Math.max(0, 5 - playerSoldiers.length);
        const reqInfo = getFigurineRequirement('toy_soldiers', progress);
        const missingCost = reqInfo?.missingCost || (missingCount * 25);
        const canAfford = (progress.playerGold || 0) >= missingCost;

        const handleAutoBuySoldiers = () => {
            const res = executeAutoPurchaseForActivity('toy_soldiers', progress);
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
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-950/80 border-2 border-amber-500/50 flex items-center justify-center text-3xl shadow-inner">
                        💂‍♂️
                    </div>

                    <div>
                        <h3 className="font-serif font-black text-xl text-amber-300">
                            Недостатньо солдатиків для битви!
                        </h3>
                        <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                            Для тактичної битви <strong className="text-amber-200">«Солдатики 15х15»</strong> необхідно сформувати загін із <strong>5 готових солдатиків</strong> (не зношених, &lt; 3/3 поразок).
                        </p>
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-stone-800 text-xs flex items-center justify-between">
                        <span className="text-stone-300 font-bold">Готових солдатиків у колекції:</span>
                        <span className={`font-black text-base px-3 py-1 rounded-xl border ${
                            playerSoldiers.length >= 5
                                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                                : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                        }`}>
                            {playerSoldiers.length} / 5
                        </span>
                    </div>

                    <p className="text-[11px] text-amber-400/90 italic">
                        *Зношені солдатики (3/3) не можуть брати участь у бою. Скористайтеся автопокупкою або придбайте бійців у магазині!
                    </p>

                    <div className="flex flex-col gap-2 pt-2">
                        {canAfford ? (
                            <button
                                onClick={handleAutoBuySoldiers}
                                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition hover:scale-[1.02]"
                            >
                                <Zap className="w-4 h-4 fill-current" />
                                <span>⚡ Автопокупка {missingCount} солдатиків ({missingCost} 🪙)</span>
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

    const validMoves = selectedUnit && currentTurn === 'player' && !selectedUnit.hasActed ? getValidMoves(selectedUnit) : [];
    const validTargets = selectedUnit && currentTurn === 'player' && !selectedUnit.hasActed ? getValidAttackTargets(selectedUnit) : [];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#140f0c] border-2 border-amber-600/60 rounded-3xl p-3 sm:p-5 max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-[#f5ebd7]"
                >
                    {/* Top Header */}
                    <div className="flex justify-between items-center pb-2.5 border-b border-amber-900/40">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xl">
                                💂‍♂️
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-black text-amber-300 font-serif flex items-center gap-2">
                                    <span>Тактична гра в солдатики 15х15</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/40 text-amber-200">
                                        Раунд {roundNumber}
                                    </span>
                                </h2>
                                <div className="text-[11px] text-[#a89988]">
                                    Супротивник: <span className="text-amber-200 font-bold">{opponent?.name || 'Супротивник'}</span> • Таверна: {displayTavernName}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border ${
                                currentTurn === 'player'
                                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-sm'
                                    : 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse'
                            }`}>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{currentTurn === 'player' ? 'Ваш хід' : 'Хід супротивника...'}</span>
                            </div>

                            <button
                                onClick={() => {
                                    if (battleResult?.winner === 'player' && onVictory) {
                                        onVictory();
                                    } else if (battleResult?.winner === 'opponent' && onDefeat) {
                                        onDefeat();
                                    } else {
                                        onClose();
                                    }
                                }}
                                className="p-1.5 text-stone-400 hover:text-white bg-stone-900 hover:bg-stone-800 rounded-full transition-colors border border-stone-800 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Main Game Arena */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 mt-2.5 overflow-hidden">
                        {/* LEFT: 15x15 Interactive Tactical Board */}
                        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-[#1b1511] p-2.5 rounded-2xl border border-stone-800 shadow-inner overflow-auto max-h-[62vh] lg:max-h-full">
                            <div 
                                className="grid grid-cols-15 gap-0.5 bg-stone-950 p-1.5 rounded-xl border-2 border-[#3d2f24] shadow-2xl"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(15, minmax(0, 1fr))',
                                    width: '100%',
                                    maxWidth: '520px',
                                    aspectRatio: '1/1'
                                }}
                            >
                                {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, cellIdx) => {
                                    const x = cellIdx % BOARD_SIZE;
                                    const y = Math.floor(cellIdx / BOARD_SIZE);
                                    const unitOnCell = getUnitAt(x, y);

                                    const isSelected = selectedUnit && selectedUnit.x === x && selectedUnit.y === y;
                                    const validMoves = selectedUnit && currentTurn === 'player' && !selectedUnit.hasActed ? getValidMoves(selectedUnit) : [];
                                    const validTargets = selectedUnit && currentTurn === 'player' && !selectedUnit.hasActed ? getValidAttackTargets(selectedUnit) : [];
                                    const healTargets = selectedUnit && currentTurn === 'player' && !selectedUnit.hasActed ? getValidHealTargets(selectedUnit) : [];

                                    const isValidMove = validMoves.some(m => m.x === x && m.y === y);
                                    const isValidTarget = validTargets.some(t => t.x === x && t.y === y);
                                    const isValidHealTarget = isSelectingHealTarget && healTargets.some(t => t.x === x && t.y === y);

                                    const isEvenSquare = (x + y) % 2 === 0;

                                    return (
                                        <button
                                            key={`${x}-${y}`}
                                            onClick={() => {
                                                if (unitOnCell) {
                                                    if (isValidHealTarget) {
                                                        handleHealAlly(unitOnCell);
                                                    } else if (unitOnCell.team === 'player') {
                                                        setSelectedUnitId(unitOnCell.unitId);
                                                        setIsSelectingHealTarget(false);
                                                    } else if (isValidTarget) {
                                                        handleInitiateCombat(unitOnCell);
                                                    }
                                                } else if (isValidMove) {
                                                    handleMoveUnit(x, y);
                                                    setIsSelectingHealTarget(false);
                                                }
                                            }}
                                            className={`relative aspect-square flex items-center justify-center transition-all text-xs select-none rounded-[3px] ${
                                                isSelected
                                                    ? 'bg-amber-500/40 ring-2 ring-amber-400 z-10'
                                                    : isValidHealTarget
                                                    ? 'bg-emerald-900/80 ring-2 ring-emerald-400 animate-pulse z-10 cursor-pointer'
                                                    : isValidTarget
                                                    ? 'bg-rose-900/60 ring-2 ring-rose-500 animate-pulse z-10'
                                                    : isValidMove
                                                    ? 'bg-emerald-900/50 hover:bg-emerald-800/70 ring-1 ring-emerald-500/50 cursor-pointer'
                                                    : isEvenSquare
                                                    ? 'bg-[#2a211a]'
                                                    : 'bg-[#201813]'
                                            }`}
                                        >
                                            {/* Valid move indicator dot */}
                                            {isValidMove && !unitOnCell && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-md animate-ping" />
                                            )}

                                            {/* Unit rendering */}
                                            {unitOnCell && (
                                                <div className="relative flex flex-col items-center justify-center w-full h-full p-0">
                                                    <ToySoldierFigurine 
                                                        type={unitOnCell.type} 
                                                        team={unitOnCell.team} 
                                                        size="grid" 
                                                        hasActed={unitOnCell.hasActed && currentTurn === unitOnCell.team}
                                                        isAlive={unitOnCell.isAlive}
                                                        level={unitOnCell.level}
                                                        isSelected={isSelected}
                                                        showBase={true}
                                                    />

                                                    {/* Mini HP bar */}
                                                    <div className="absolute -bottom-0.5 inset-x-0.5 h-1 bg-black/90 rounded-full overflow-hidden flex z-20 border border-stone-900">
                                                        <div
                                                            className={`h-full transition-all ${
                                                                unitOnCell.team === 'player' ? 'bg-emerald-400' : 'bg-rose-500'
                                                            }`}
                                                            style={{ width: `${(unitOnCell.hp / unitOnCell.maxHp) * 100}%` }}
                                                        />
                                                    </div>

                                                    {/* Potion indicator icon */}
                                                    {unitOnCell.potionsLeft > 0 && (
                                                        <span className="absolute -top-1 -right-1 text-[8px] leading-none z-20 bg-stone-950/80 rounded-full p-0.5">
                                                            🧪
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT: Unit Action Controls, Unit Card & Tactical Log */}
                        <div className="lg:col-span-4 flex flex-col gap-2.5 overflow-hidden">
                            {/* Selected Unit Card */}
                            {selectedUnit ? (
                                <div className="p-3.5 rounded-2xl bg-[#1c1510] border border-amber-600/40 shadow-md space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1 bg-stone-900 rounded-2xl border border-amber-600/40 shadow-inner flex items-center justify-center">
                                                <ToySoldierFigurine 
                                                    type={selectedUnit.type} 
                                                    team={selectedUnit.team} 
                                                    size="md" 
                                                    level={selectedUnit.level}
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xs sm:text-sm text-amber-200 font-serif flex items-center gap-1.5 flex-wrap">
                                                    <span>{selectedUnit.name}</span>
                                                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-900 border border-amber-600 text-amber-300 font-sans">
                                                        Рівень {selectedUnit.level}★
                                                    </span>
                                                    {selectedUnit.team === 'player' && selectedUnit.soldierRef && (
                                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-500 text-yellow-300 font-bold flex items-center gap-0.5">
                                                            <Sparkles className="w-2.5 h-2.5" />
                                                            <span>{selectedUnit.soldierRef.experience || 0} XP</span>
                                                        </span>
                                                    )}
                                                </h4>
                                                <div className="text-[10px] text-stone-400">
                                                    Позиція: ({selectedUnit.x + 1}, {selectedUnit.y + 1}) • {selectedUnit.hasActed ? 'Діяв у цьому раунді' : 'Готовий до дії'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-black/40 border border-stone-850 text-center text-[10px]">
                                        <div>
                                            <span className="text-stone-400 block">Здоров'я:</span>
                                            <span className="font-bold text-rose-400">{selectedUnit.hp} / {selectedUnit.maxHp} HP</span>
                                        </div>
                                        <div>
                                            <span className="text-stone-400 block">Рух:</span>
                                            <span className="font-bold text-emerald-300">{selectedUnit.maxMoveDistance} кл</span>
                                        </div>
                                        <div>
                                            <span className="text-stone-400 block">Атака (1/2/3):</span>
                                            <span className="font-bold text-amber-300">
                                                {getSoldierAttackModifier(selectedUnit.type, 1) ?? '-'}/
                                                {getSoldierAttackModifier(selectedUnit.type, 2) ?? '-'}/
                                                {getSoldierAttackModifier(selectedUnit.type, 3) ?? '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-stone-400 block">Захист:</span>
                                            <span className="font-bold text-blue-300">{selectedUnit.defBonus >= 0 ? `+${selectedUnit.defBonus}` : selectedUnit.defBonus}</span>
                                        </div>
                                    </div>

                                    {/* Special Ability Controls (Mage & Cleric) */}
                                    {normalizeSoldierType(selectedUnit.type) === 'маг' && selectedUnit.magicChargesLeft > 0 && (
                                        <button
                                            disabled={currentTurn !== 'player' || selectedUnit.hasActed}
                                            onClick={() => setUseMageCharge(!useMageCharge)}
                                            className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border ${
                                                useMageCharge
                                                    ? 'bg-purple-900 border-purple-400 text-purple-200 shadow-lg animate-pulse'
                                                    : 'bg-purple-950/60 border-purple-800 text-purple-300 hover:bg-purple-900'
                                            }`}
                                        >
                                            <span>✨</span>
                                            <span>Магічний заряд (+1 к атаці) — {useMageCharge ? 'Активовано!' : 'Активувати'}</span>
                                        </button>
                                    )}

                                     {normalizeSoldierType(selectedUnit.type) === 'клірик' && selectedUnit.healChargesLeft > 0 && (
                                        <button
                                            disabled={currentTurn !== 'player' || selectedUnit.hasActed}
                                            onClick={() => setIsSelectingHealTarget(!isSelectingHealTarget)}
                                            className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border ${
                                                isSelectingHealTarget
                                                    ? 'bg-emerald-900 border-emerald-400 text-emerald-200 shadow-lg animate-pulse'
                                                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                                            }`}
                                        >
                                            <span>⚕️</span>
                                            <span>Зцілення (+1 HP союзнику) — {isSelectingHealTarget ? 'Оберіть ціль на дошці' : 'Застосувати'}</span>
                                        </button>
                                    )}

                                    {normalizeSoldierType(selectedUnit.type) === 'алхімік' && selectedUnit.bombChargesLeft > 0 && (
                                        <button
                                            disabled={currentTurn !== 'player' || selectedUnit.hasActed}
                                            onClick={() => setUseBombCharge(!useBombCharge)}
                                            className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border ${
                                                useBombCharge
                                                    ? 'bg-amber-900 border-amber-400 text-amber-200 shadow-lg animate-pulse'
                                                    : 'bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900'
                                            }`}
                                        >
                                            <span>💣</span>
                                            <span>Вибухова бомба (+1 к атаці) — {useBombCharge ? 'Підготовлено!' : 'Підготувати'}</span>
                                        </button>
                                    )}

                                    {normalizeSoldierType(selectedUnit.type) === 'паладин' && selectedUnit.holyChargesLeft > 0 && (
                                        <button
                                            disabled={currentTurn !== 'player' || selectedUnit.hasActed}
                                            onClick={() => {
                                                setUnits(prev => prev.map(u => u.unitId === selectedUnit.unitId ? { ...u, defBonus: u.defBonus + 1, holyChargesLeft: u.holyChargesLeft - 1 } : u));
                                                playShieldBlockSound();
                                                setActionLog(prev => [`⚜️ ${selectedUnit.name} закликав Ауру Святого Щита (+1 к захисту)!`, ...prev.slice(0, 15)]);
                                            }}
                                            className="w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border bg-yellow-950/60 border-yellow-500/60 text-yellow-300 hover:bg-yellow-900"
                                        >
                                            <span>⚜️</span>
                                            <span>Аура святого щита (+1 к захисту)</span>
                                        </button>
                                    )}

                                    {/* Interactive action buttons for selected unit */}
                                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                                        <button
                                            disabled={currentTurn !== 'player' || selectedUnit.hasActed || selectedUnit.potionsLeft <= 0 || selectedUnit.hp >= selectedUnit.maxHp}
                                            onClick={handleDrinkPotion}
                                            className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                selectedUnit.potionsLeft > 0 && selectedUnit.hp < selectedUnit.maxHp && !selectedUnit.hasActed && currentTurn === 'player'
                                                    ? 'bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-700 hover:to-teal-600 text-white shadow-md'
                                                    : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                                            }`}
                                        >
                                            <span>🧪</span>
                                            <span>Зілля (+1 HP) ({selectedUnit.potionsLeft})</span>
                                        </button>

                                        <button
                                            disabled={currentTurn !== 'player' || selectedUnit.hasActed}
                                            onClick={handleFinishUnitAction}
                                            className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                                                !selectedUnit.hasActed && currentTurn === 'player'
                                                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 shadow-md'
                                                    : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                                            }`}
                                        >
                                            <span>⏹️</span>
                                            <span>Завершити хід</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-2xl bg-[#1c1510] border border-stone-800 text-center text-xs text-stone-500">
                                    Оберіть свого солдатика на дошці для переміщення (1-3 кл) або атаки ворога.
                                </div>
                            )}

                            {/* End Team Turn Button */}
                            <button
                                disabled={currentTurn !== 'player' || isAiThinking}
                                onClick={handleEndPlayerTurn}
                                className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md ${
                                    currentTurn === 'player'
                                        ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-stone-950 active:scale-95'
                                        : 'bg-stone-900 text-stone-600 border border-stone-800 cursor-not-allowed'
                                }`}
                            >
                                <ChevronRight className="w-4 h-4" />
                                <span>Передати хід супротивнику</span>
                            </button>

                            {/* Tactical Log */}
                            <div className="flex-1 flex flex-col p-3 rounded-2xl bg-[#100c0a] border border-stone-850 overflow-hidden">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center justify-between">
                                    <span>Журнал битви:</span>
                                    <span className="text-stone-500">Дошка 15х15</span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-[11px] leading-relaxed">
                                    {actionLog.map((log, idx) => (
                                        <div key={idx} className="text-stone-300 border-b border-stone-900/60 pb-1">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COMBAT DICE DUEL OVERLAY (Sequential Rolling) */}
                    <AnimatePresence>
                        {activeCombat && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-[#1b1410] border-2 border-amber-500 rounded-3xl p-5 max-w-lg w-full shadow-2xl space-y-4 text-[#f5ebd7]"
                                >
                                    <div className="text-center pb-2 border-b border-stone-800">
                                        <h3 className="text-lg font-black text-amber-300 font-serif flex items-center justify-center gap-2">
                                            <span>⚔️ Двобій на костях d20</span>
                                        </h3>
                                        <p className="text-xs text-stone-400 mt-0.5">
                                            Дистанція: {activeCombat.distance} кл {activeCombat.rangePenalty < 0 ? `(Штраф до атаки: ${activeCombat.rangePenalty})` : '(Ближня атака)'}
                                        </p>
                                    </div>

                                    {/* Fighters comparison */}
                                    <div className="grid grid-cols-2 gap-3 items-center">
                                        {/* Attacker */}
                                        <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-600/50 text-center space-y-1">
                                            <div className="flex justify-center my-1">
                                                <ToySoldierFigurine 
                                                    type={activeCombat.attacker.type} 
                                                    team={activeCombat.attacker.team} 
                                                    size="lg" 
                                                    level={activeCombat.attacker.level}
                                                />
                                            </div>
                                            <div className="font-bold text-xs text-amber-200">{activeCombat.attacker.name}</div>
                                            <div className="text-[10px] text-amber-400/80 font-bold uppercase">Атакуючий</div>

                                            {/* Roll score */}
                                            <div className="mt-2 p-2 bg-black/50 rounded-xl border border-stone-800">
                                                <div className="text-[10px] text-stone-400">Кидок d20 + Бонуси:</div>
                                                <div className="text-xl font-black text-amber-300">
                                                    {activeCombat.finalAttack !== null 
                                                        ? `${activeCombat.finalAttack} (${activeCombat.attackRoll} + ${activeCombat.attackBonus}${activeCombat.rangePenalty})` 
                                                        : activeCombat.rollingEntity === 'attacker' ? '🎲 Кидає...' : 'Очікує кидка'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Defender */}
                                        <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-600/50 text-center space-y-1">
                                            <div className="flex justify-center my-1">
                                                <ToySoldierFigurine 
                                                    type={activeCombat.defender.type} 
                                                    team={activeCombat.defender.team} 
                                                    size="lg" 
                                                    level={activeCombat.defender.level}
                                                />
                                            </div>
                                            <div className="font-bold text-xs text-blue-200">{activeCombat.defender.name}</div>
                                            <div className="text-[10px] text-blue-400/80 font-bold uppercase">Захисник</div>

                                            {/* Roll score */}
                                            <div className="mt-2 p-2 bg-black/50 rounded-xl border border-stone-800">
                                                <div className="text-[10px] text-stone-400">Кидок d20 + Бонус захисту:</div>
                                                <div className="text-xl font-black text-blue-300">
                                                    {activeCombat.finalDefense !== null 
                                                        ? `${activeCombat.finalDefense} (${activeCombat.defenseRoll} + ${activeCombat.defenseBonus})` 
                                                        : activeCombat.rollingEntity === 'defender' ? '🎲 Кидає...' : 'Очікує кидка'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action step buttons */}
                                    <div className="pt-2">
                                        {activeCombat.phase === 'ready_attack' && (
                                            <button
                                                disabled={activeCombat.rollingEntity !== null}
                                                onClick={handleRollAttack}
                                                className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
                                            >
                                                <span>🎲 Кинути кубик атаки (d20)</span>
                                            </button>
                                        )}

                                        {activeCombat.phase === 'ready_defend' && (
                                            activeCombat.defender.team === 'player' ? (
                                                <button
                                                    disabled={activeCombat.rollingEntity !== null}
                                                    onClick={handleRollDefenseForPlayer}
                                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
                                                >
                                                    <span>🎲 Кинути кубик захисту (d20)</span>
                                                </button>
                                            ) : (
                                                <div className="text-center py-2 text-stone-400 text-xs animate-pulse">
                                                    Супротивник кидає кубик захисту...
                                                </div>
                                            )
                                        )}

                                        {activeCombat.phase === 'clash_resolved' && (
                                            <div className="space-y-3">
                                                <div className={`p-3 rounded-xl text-center text-xs font-bold border ${
                                                    activeCombat.hitSuccess
                                                        ? 'bg-rose-950/60 border-rose-600 text-rose-300'
                                                        : 'bg-blue-950/60 border-blue-600 text-blue-300'
                                                }`}>
                                                    {activeCombat.hitSuccess
                                                        ? `⚔️ Атака (${activeCombat.finalAttack}) подолала захист (${activeCombat.finalDefense})! Нанесено 1 очко пошкодження!`
                                                        : `🛡️ Захисник (${activeCombat.finalDefense}) відбив атаку (${activeCombat.finalAttack})! Пошкоджень немає.`}
                                                </div>

                                                <button
                                                    onClick={handleApplyCombatOutcome}
                                                    className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold rounded-xl text-xs transition-colors"
                                                >
                                                    Продовжити бій
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* MATCH RESULT MODAL */}
                    <AnimatePresence>
                        {battleResult && (
                            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-[#1b1410] border-2 border-amber-500 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl text-[#f5ebd7]"
                                >
                                    <div className="text-5xl animate-bounce">
                                        {battleResult.winner === 'player' ? '🏆' : '💀'}
                                    </div>

                                    <h3 className="text-2xl font-black font-serif text-amber-300">
                                        {battleResult.winner === 'player' ? 'Славна Перемога!' : 'Поразка вашого загону'}
                                    </h3>

                                    {/* Rewards & XP */}
                                    {battleResult.winner === 'player' ? (
                                        <div className="space-y-2 text-xs">
                                            <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-600/40 flex justify-between items-center">
                                                <span className="text-stone-300">Вигране золото:</span>
                                                <span className="font-black text-amber-300 text-sm">+{battleResult.goldWon} Золота</span>
                                            </div>

                                            {battleResult.xpGained.length > 0 && (
                                                <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-600/40 text-left space-y-1">
                                                    <div className="font-bold text-emerald-300">Отриманий досвід непобитих бійців (+1 XP):</div>
                                                    {battleResult.xpGained.map((xpItem, idx) => (
                                                        <div key={idx} className="flex justify-between text-[11px] text-stone-300">
                                                            <span>{xpItem.name}</span>
                                                            <span className="font-bold text-amber-300">
                                                                +1 XP {xpItem.leveledUp ? `(🎉 Рівень ${xpItem.newLevel}!)` : ''}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : null}

                                    {/* Damaged & Broken warnings */}
                                    {battleResult.damagedSoldiers.length > 0 && (
                                        <div className="p-2.5 bg-amber-950/30 rounded-xl border border-amber-700/40 text-left text-[11px] space-y-1">
                                            <div className="font-bold text-amber-400">Побиті солдатики повертаються:</div>
                                            {battleResult.damagedSoldiers.map((ds, idx) => (
                                                <div key={idx} className="text-stone-300 flex justify-between">
                                                    <span>{ds.name}</span>
                                                    <span className="text-amber-300 font-bold">Стійкість: {ds.currentDeaths} / 4</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {battleResult.brokenSoldiers.length > 0 && (
                                        <div className="p-3 bg-rose-950/60 rounded-xl border border-rose-600 text-left text-xs space-y-1">
                                            <div className="font-bold text-rose-300 flex items-center gap-1">
                                                <AlertTriangle className="w-4 h-4 text-rose-400" />
                                                <span>Солдатики розвалилися (4/4 поразки):</span>
                                            </div>
                                            {battleResult.brokenSoldiers.map((bs, idx) => (
                                                <div key={idx} className="text-rose-200">
                                                    • {bs.name} розпався на частини.
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={initializeGame}
                                            className="flex-1 py-3 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold rounded-xl text-xs border border-stone-700"
                                        >
                                            Зіграти ще раз
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (battleResult?.winner === 'player') {
                                                    if (onVictory) onVictory();
                                                    else onClose();
                                                } else {
                                                    if (onDefeat) onDefeat();
                                                    else onClose();
                                                }
                                            }}
                                            className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black rounded-xl text-xs shadow-lg cursor-pointer"
                                        >
                                            До таверни
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default ToySoldiersModal;


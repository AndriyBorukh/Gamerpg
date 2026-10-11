import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WorldProgress } from '../types';
import { 
    Coins, 
    Trophy, 
    X, 
    Shield, 
    Sparkles, 
    Flame, 
    Flag, 
    Target, 
    Crosshair, 
    Zap, 
    Play, 
    Pause, 
    RotateCcw,
    ChevronRight,
    Award
} from 'lucide-react';
import { 
    playGallopSound, 
    playTargetHitSound, 
    playTargetMissSound, 
    playVictorySound, 
    playDefeatSound,
    playDiceRollSound 
} from '../lib/soundEffects';
import { calculateTotalHealth } from '../lib/brawlEngine';

export type RaceType = 'steeplechase' | 'flat_horse_race' | 'mounted_archery';

interface HorseRaceModalProps {
    isOpen: boolean;
    raceType: RaceType;
    tavernName: string;
    progress: WorldProgress;
    betAmount: number;
    onVictory: (reward: number) => void;
    onDefeat: (penalty: number) => void;
    onClose: () => void;
    onUpdateProgress?: (updatedProgress: WorldProgress) => void;
}

export interface Racer {
    id: string;
    name: string;
    avatar: string;
    horseName: string;
    horseColor: string;
    distance: number; // 0 to 2000m
    hp: number;
    maxHp: number;
    agility: number;
    horseRidingMod: number;
    archeryMod: number;
    ridingPoints: number;
    archeryPoints: number;
    totalPoints: number;
    lastRollDetail?: {
        speedD20: number;
        speedTotal: number;
        obstacleDc?: number;
        obstacleCleared?: boolean;
        archeryD20?: number;
        archeryTotal?: number;
        archeryDc?: number;
        archeryD4?: number;
        archeryStepN?: number;
        archeryHit?: boolean;
    };
    targetsHit: number;
    targetsMissed: number;
    isEliminated: boolean;
    isPlayer?: boolean;
}

const STEP_DISTANCE = 100;

const AI_RACERS_DATA = [
    { name: 'Олекса Запорожець', horseName: 'Буревій', avatar: '🏇', horseColor: 'from-amber-700 to-amber-900', agility: 14, riding: 4, archery: 4 },
    { name: 'Богдан Стрімкий', horseName: 'Вітрогін', avatar: '🐎', horseColor: 'from-stone-700 to-stone-900', agility: 13, riding: 3, archery: 3 },
    { name: 'Ярослав Лицар', horseName: 'Громобій', avatar: '🏇', horseColor: 'from-yellow-700 to-amber-800', agility: 15, riding: 4, archery: 2 },
    { name: 'Тарас Вільний', horseName: 'Сокіл', avatar: '🐎', horseColor: 'from-orange-700 to-red-900', agility: 12, riding: 3, archery: 4 },
    { name: 'Максим Вершник', horseName: 'Зорепад', avatar: '🏇', horseColor: 'from-emerald-800 to-stone-900', agility: 14, riding: 3, archery: 3 },
    { name: 'Дмитро Золотогривий', horseName: 'Світанок', avatar: '🐎', horseColor: 'from-amber-600 to-yellow-800', agility: 13, riding: 4, archery: 3 },
    { name: 'Артем Блискавка', horseName: 'Сапсан', avatar: '🏇', horseColor: 'from-blue-800 to-stone-900', agility: 15, riding: 3, archery: 4 },
    { name: 'Роман Хоробрий', horseName: 'Орел', avatar: '🐎', horseColor: 'from-red-800 to-stone-900', agility: 12, riding: 3, archery: 2 }
];

export function HorseRaceModal({
    isOpen,
    raceType: initialRaceType,
    tavernName,
    progress,
    betAmount,
    onVictory,
    onDefeat,
    onClose,
    onUpdateProgress
}: HorseRaceModalProps) {
    const [activeRaceType, setActiveRaceType] = useState<RaceType>(initialRaceType);
    const [currentMeter, setCurrentMeter] = useState<number>(0);
    const [racers, setRacers] = useState<Racer[]>([]);
    const [raceLog, setRaceLog] = useState<Array<{ id: string; text: string; type: 'info' | 'success' | 'danger' | 'warning' }>>([]);
    const [raceOver, setRaceOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<Racer | null>(null);
    const [isPlayerWon, setIsPlayerWon] = useState<boolean>(false);
    const [autoPlay, setAutoPlay] = useState<boolean>(false);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    // Player calculations
    const playerAgility = progress.playerStats?.agility || 14;
    const playerHorseRidingMod = Math.max(1, Math.floor(playerAgility / 3));
    const playerArcheryMod = Math.max(1, Math.floor(playerAgility / 3));
    const playerHp = progress.playerStats?.baseHp || 100;

    const totalDistance = activeRaceType === 'steeplechase' ? 3000 : 2000;
    const totalSteps = totalDistance / STEP_DISTANCE;

    const getRaceTitle = (type: RaceType) => {
        switch (type) {
            case 'steeplechase':
                return 'Кінні перегони з перешкодами (Steeplechase 3000м)';
            case 'flat_horse_race':
                return 'Кінні скачки на дистанцію 2000м (Flat Horse Race)';
            case 'mounted_archery':
                return 'Кінні перегони зі стрільбою (Mounted Archery Race)';
        }
    };

    const getRaceDescription = (type: RaceType) => {
        const dist = type === 'steeplechase' ? 3000 : 2000;
        switch (type) {
            case 'steeplechase':
                return `Змагання проти 8 суперників на ${dist}м. Кожні 100м — перешкода зі зростаючою складністю N! Кидок: 1d20 + Спритність + Модифікатор їзди. Невдача наносить пошкодження і коню, і вершнику!`;
            case 'flat_horse_race':
                return `Змагання проти 8 суперників на ${dist}м. Кожні 100м кидається 1d20 + Спритність + Модифікатор їзди. Переможець той, хто за ${dist} метрів набрав найбільше очок швидкості!`;
            case 'mounted_archery':
                return `Змагання проти 8 суперників на ${dist}м. Кожні 100м: кидок швидкості (1d20 + Спритність + Їзда) + постріл у мішень (1d20 + Спритність + Стрільба проти DC = 17 + N кроку + 1d4). Влучання дає +10 очок, промах -10 очок!`;
        }
    };

    const initRace = (type: RaceType) => {
        setActiveRaceType(type);
        setCurrentMeter(0);
        setRaceOver(false);
        setWinner(null);
        setIsPlayerWon(false);
        setAutoPlay(false);

        const initialRacers: Racer[] = [
            {
                id: 'player',
                name: 'Ви (Лицар-Вершник)',
                horseName: 'Пегас-Буян',
                avatar: '🛡️',
                horseColor: 'from-amber-500 to-yellow-600',
                distance: 0,
                hp: playerHp,
                maxHp: playerHp,
                agility: playerAgility,
                horseRidingMod: playerHorseRidingMod,
                archeryMod: playerArcheryMod,
                ridingPoints: 0,
                archeryPoints: 0,
                totalPoints: 0,
                targetsHit: 0,
                targetsMissed: 0,
                isEliminated: false,
                isPlayer: true
            },
            ...AI_RACERS_DATA.map((ai, idx) => ({
                id: `ai_${idx}`,
                name: ai.name,
                horseName: ai.horseName,
                avatar: ai.avatar,
                horseColor: ai.horseColor,
                distance: 0,
                hp: 100,
                maxHp: 100,
                agility: ai.agility,
                horseRidingMod: ai.riding,
                archeryMod: ai.archery,
                ridingPoints: 0,
                archeryPoints: 0,
                totalPoints: 0,
                targetsHit: 0,
                targetsMissed: 0,
                isEliminated: false,
                isPlayer: false
            }))
        ];

        const dist = type === 'steeplechase' ? 3000 : 2000;
        setRacers(initialRacers);
        setRaceLog([
            {
                id: 'start',
                text: `🏁 Старт ${getRaceTitle(type)} у таверні «${tavernName}»! 9 скакунів на стартовій лінії ${dist}м!`,
                type: 'info'
            }
        ]);
    };

    useEffect(() => {
        if (isOpen) {
            initRace(initialRaceType);
        }
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [isOpen, initialRaceType]);

    // Auto-step effect
    useEffect(() => {
        if (autoPlay && !raceOver) {
            autoPlayRef.current = setInterval(() => {
                handleStep();
            }, 1200);
        } else {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        }
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [autoPlay, raceOver, currentMeter, racers]);

    const handleStep = () => {
        if (raceOver) return;

        const nextMeter = currentMeter + STEP_DISTANCE;
        const legIndex = nextMeter / STEP_DISTANCE; // 1 to 20
        playGallopSound();

        // Steeplechase difficulty curve: grows each 100m (e.g. 100m -> DC 8, 200m -> DC 9 ... 2000m -> DC 27)
        const obstacleDifficulty = 8 + legIndex;

        const logsToAdd: Array<{ id: string; text: string; type: 'info' | 'success' | 'danger' | 'warning' }> = [];

        const updatedRacers = racers.map(racer => {
            if (racer.isEliminated) return racer;

            // 1. Speed Roll: 1d20 + Agility + HorseRidingMod
            const speedD20 = Math.floor(Math.random() * 20) + 1;
            const speedTotal = speedD20 + racer.agility + racer.horseRidingMod;

            let newHp = racer.hp;
            let isEliminated = racer.isEliminated;
            let obstacleCleared = true;
            let archeryD20: number | undefined;
            let archeryTotal: number | undefined;
            let archeryHit: boolean | undefined;
            let newTargetsHit = racer.targetsHit;
            let newTargetsMissed = racer.targetsMissed;
            let stepArcheryScore = 0;

            // Mode 1: Steeplechase (Obstacles)
            if (activeRaceType === 'steeplechase') {
                if (speedTotal < obstacleDifficulty) {
                    obstacleCleared = false;
                    const dmg = Math.max(5, Math.floor(obstacleDifficulty / 2));
                    newHp = Math.max(0, racer.hp - dmg);
                    if (newHp === 0) {
                        isEliminated = true;
                    }
                    if (racer.isPlayer) {
                        const baseHp = progress.playerStats?.baseHp || 100;
                        const strength = progress.playerStats?.strength || 15;
                        const maxHp = calculateTotalHealth(baseHp, strength);
                        const curHp = progress.playerStats?.currentHp ?? maxHp;
                        const playerDmg = Math.max(5, Math.floor(obstacleDifficulty / 2));
                        const newCurrentHp = Math.max(0, curHp - playerDmg);

                        if (onUpdateProgress) {
                            onUpdateProgress({
                                ...progress,
                                playerStats: {
                                    ...progress.playerStats,
                                    baseHp,
                                    strength,
                                    currentHp: newCurrentHp
                                }
                            });
                        }

                        logsToAdd.push({
                            id: `obs_fail_${nextMeter}_${racer.id}`,
                            text: `💥 ${racer.name} зачепив бар'єр на ${nextMeter}м! Кидок: ${speedD20}+${racer.agility}+${racer.horseRidingMod}=${speedTotal} vs DC ${obstacleDifficulty}. Кінь: -${dmg} HP, Вершник: -${playerDmg} HP!`,
                            type: 'danger'
                        });
                    }
                } else {
                    if (racer.isPlayer) {
                        logsToAdd.push({
                            id: `obs_ok_${nextMeter}_${racer.id}`,
                            text: `✨ ${racer.name} бездоганно перестрибнув перешкоду на ${nextMeter}м! (${speedTotal} vs DC ${obstacleDifficulty}) +${speedTotal} балів!`,
                            type: 'success'
                        });
                    }
                }
            }

            // Mode 3: Mounted Archery (Target shooting every 100m)
            let archeryD4: number | undefined;
            let archeryStepN: number | undefined;
            let archeryDc: number | undefined;

            if (activeRaceType === 'mounted_archery') {
                archeryD20 = Math.floor(Math.random() * 20) + 1;
                archeryTotal = archeryD20 + racer.agility + racer.archeryMod;
                archeryD4 = Math.floor(Math.random() * 4) + 1;
                archeryStepN = legIndex;
                archeryDc = 17 + archeryStepN + archeryD4;

                if (archeryTotal >= archeryDc) {
                    archeryHit = true;
                    stepArcheryScore = 10;
                    newTargetsHit += 1;
                    if (racer.isPlayer) {
                        playTargetHitSound();
                        logsToAdd.push({
                            id: `arch_hit_${nextMeter}_${racer.id}`,
                            text: `🎯 ${racer.name} на ${nextMeter}м ВЛУЧИВ у мішень! (1d20[${archeryD20}]+${racer.agility}+${racer.archeryMod}=${archeryTotal} vs DC 17+${archeryStepN}+${archeryD4}=${archeryDc}) ➔ +10 ОЧОК!`,
                            type: 'success'
                        });
                    }
                } else {
                    archeryHit = false;
                    stepArcheryScore = -10;
                    newTargetsMissed += 1;
                    if (racer.isPlayer) {
                        playTargetMissSound();
                        logsToAdd.push({
                            id: `arch_miss_${nextMeter}_${racer.id}`,
                            text: `❌ ${racer.name} на ${nextMeter}м ПРОМАХНУВСЯ повз мішень! (1d20[${archeryD20}]+${racer.agility}+${racer.archeryMod}=${archeryTotal} vs DC 17+${archeryStepN}+${archeryD4}=${archeryDc}) ➔ -10 ОЧОК!`,
                            type: 'danger'
                        });
                    }
                }
            }

            // Mode 2: Flat Horse Race log
            if (activeRaceType === 'flat_horse_race' && racer.isPlayer) {
                logsToAdd.push({
                    id: `flat_step_${nextMeter}_${racer.id}`,
                    text: `🐎 ${racer.name} подолав ${nextMeter}м з кидком швидкості: 1d20[${speedD20}] + ${racer.agility} + ${racer.horseRidingMod} = +${speedTotal} очок!`,
                    type: 'info'
                });
            }

            const stepRidingPoints = obstacleCleared ? speedTotal : Math.floor(speedTotal / 2);
            const newRidingPoints = racer.ridingPoints + stepRidingPoints;
            const newArcheryPoints = racer.archeryPoints + stepArcheryScore;
            const newTotalPoints = newRidingPoints + newArcheryPoints;

            return {
                ...racer,
                distance: nextMeter,
                hp: newHp,
                ridingPoints: newRidingPoints,
                archeryPoints: newArcheryPoints,
                totalPoints: newTotalPoints,
                targetsHit: newTargetsHit,
                targetsMissed: newTargetsMissed,
                isEliminated,
                lastRollDetail: {
                    speedD20,
                    speedTotal,
                    obstacleDc: obstacleDifficulty,
                    obstacleCleared,
                    archeryD20,
                    archeryTotal,
                    archeryDc,
                    archeryD4,
                    archeryStepN,
                    archeryHit
                }
            };
        });

        setCurrentMeter(nextMeter);
        setRacers(updatedRacers);
        setRaceLog(prev => [...logsToAdd, ...prev].slice(0, 30));

        // Check if race has reached 2000m or only 1 racer left in Steeplechase
        const activeRacers = updatedRacers.filter(r => !r.isEliminated);

        if (nextMeter >= totalDistance || (activeRaceType === 'steeplechase' && activeRacers.length <= 1)) {
            setRaceOver(true);
            setAutoPlay(false);

            let raceWinner: Racer;
            if (activeRaceType === 'steeplechase') {
                if (activeRacers.length > 0) {
                    raceWinner = [...activeRacers].sort((a, b) => b.totalPoints - a.totalPoints)[0];
                } else {
                    raceWinner = [...updatedRacers].sort((a, b) => b.distance - a.distance || b.totalPoints - a.totalPoints)[0];
                }
            } else {
                // Highest total points at 2000m wins
                raceWinner = [...updatedRacers].sort((a, b) => b.totalPoints - a.totalPoints)[0];
            }

            setWinner(raceWinner);
            const playerWon = raceWinner.isPlayer === true;
            setIsPlayerWon(playerWon);

            if (playerWon) {
                playVictorySound();
                const prize = betAmount > 0 ? betAmount * 3 : 250;
                onVictory(prize);
            } else {
                playDefeatSound();
                onDefeat(betAmount > 0 ? betAmount : 0);
            }
        }
    };

    if (!isOpen) return null;

    // Sort racers for leaderboard
    const leaderboard = [...racers].sort((a, b) => {
        if (a.isEliminated && !b.isEliminated) return 1;
        if (!a.isEliminated && b.isEliminated) return -1;
        return b.totalPoints - a.totalPoints;
    });

    const playerRacer = racers.find(r => r.isPlayer);
    const progressPercent = (currentMeter / totalDistance) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 15 }}
                className="relative w-full max-w-5xl max-h-[96vh] bg-[#14100c] border-2 border-amber-600/80 rounded-2xl shadow-2xl text-[#f5ebd7] flex flex-col overflow-hidden"
            >
                {/* Header with Race Type Badges & Switcher */}
                <div className="p-4 bg-gradient-to-r from-[#24170d] via-[#1c120a] to-[#24170d] border-b border-amber-900/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl p-2 rounded-xl bg-amber-950/80 border border-amber-600/50">
                                {activeRaceType === 'mounted_archery' ? '🏹' : activeRaceType === 'steeplechase' ? '🐎' : '🏇'}
                            </span>
                            <div>
                                <h3 className="text-xl font-bold font-serif text-amber-200">
                                    {getRaceTitle(activeRaceType)}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-[#a89988]">
                                    <span>Таверна: <strong className="text-amber-300">{tavernName}</strong></span>
                                    <span>•</span>
                                    <span>Дистанція: <strong className="text-yellow-400">{totalDistance} метрів</strong></span>
                                    {betAmount > 0 && (
                                        <>
                                            <span>•</span>
                                            <span className="text-amber-400 font-bold flex items-center gap-1">
                                                <Coins className="w-3.5 h-3.5" /> Ставка: {betAmount} 🪙 (Виграш x3)
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mode Switching Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {(['flat_horse_race', 'steeplechase', 'mounted_archery'] as RaceType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => {
                                    if (currentMeter === 0 || raceOver || window.confirm('Почати новий забіг у цьому режимі?')) {
                                        initRace(type);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                    activeRaceType === type
                                        ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 shadow-md font-black'
                                        : 'bg-[#1e1711] text-stone-400 hover:text-stone-200 border border-stone-800'
                                }`}
                            >
                                <span>{type === 'mounted_archery' ? '🎯 Кінна стрільба' : type === 'steeplechase' ? '🚧 З перешкодами (3000м)' : '🏇 Скачки 2000м'}</span>
                            </button>
                        ))}
                    </div>

                    {/* Description Banner */}
                    <div className="p-2.5 rounded-xl bg-[#1a120b] border border-amber-900/40 text-xs text-[#c4b5a0] flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{getRaceDescription(activeRaceType)}</span>
                    </div>
                </div>

                {/* Main Interactive Racing View */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {/* Race Progress Bar & Checkpoints */}
                    <div className="bg-[#1a130e] p-3 rounded-xl border border-amber-900/40 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-amber-300 flex items-center gap-1">
                                <Flag className="w-3.5 h-3.5 text-amber-400" />
                                Відрізок: {currentMeter} / {totalDistance} м ({Math.floor(progressPercent)}%)
                            </span>
                            <span className="text-stone-400">
                                Крок: {Math.min(totalSteps, currentMeter / STEP_DISTANCE)} / {totalSteps} (по 100м)
                            </span>
                        </div>
                        <div className="w-full bg-stone-900 h-3 rounded-full overflow-hidden border border-stone-800 relative">
                            <div 
                                className="h-full bg-gradient-to-r from-amber-600 via-yellow-500 to-emerald-500 transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Interactive Visual Racetrack Canvas */}
                    <div className="bg-gradient-to-b from-[#1c140d] to-[#120d09] p-3 rounded-xl border border-amber-900/50 shadow-inner space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-amber-300 border-b border-amber-900/40 pb-1">
                            <span>🏁 Іподром таверни (9 скакунів)</span>
                            <span>Фініш: {totalDistance}м 🏁</span>
                        </div>

                        {/* Lanes */}
                        <div className="space-y-1.5">
                            {racers.map((racer, idx) => {
                                const racerProgress = (racer.distance / totalDistance) * 100;
                                const isLeader = leaderboard[0]?.id === racer.id;

                                return (
                                    <div 
                                        key={racer.id}
                                        className={`relative flex items-center h-9 rounded-lg px-2 text-xs border transition-all ${
                                            racer.isPlayer
                                                ? 'bg-amber-950/50 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                                                : racer.isEliminated
                                                ? 'bg-stone-900/40 border-stone-800 opacity-40'
                                                : 'bg-[#18120c] border-amber-900/30'
                                        }`}
                                    >
                                        {/* Lane label */}
                                        <div className="w-24 shrink-0 flex items-center gap-1.5 truncate z-10">
                                            <span className="text-xs font-black text-amber-400">#{idx + 1}</span>
                                            <span className="font-bold text-stone-200 truncate">{racer.name.split(' ')[0]}</span>
                                            {racer.isPlayer && <span className="text-[10px] px-1 bg-amber-500 text-black font-black rounded">ВИ</span>}
                                        </div>

                                        {/* Running Track Lane */}
                                        <div className="flex-1 relative h-6 bg-black/40 rounded border border-stone-800/80 mx-2 overflow-hidden">
                                            {/* Distance ticks */}
                                            <div className="absolute inset-0 flex justify-between opacity-15 pointer-events-none">
                                                {Array.from({ length: 10 }).map((_, i) => (
                                                    <div key={i} className="h-full w-[1px] bg-stone-400" />
                                                ))}
                                            </div>

                                            {/* Moving Horse Sprite */}
                                            <motion.div
                                                className="absolute top-0 bottom-0 flex items-center gap-1"
                                                animate={{ left: `calc(${Math.min(92, racerProgress)}% - 10px)` }}
                                                transition={{ type: 'spring', damping: 15, stiffness: 120 }}
                                            >
                                                <span className="text-lg filter drop-shadow-md select-none">
                                                    {racer.isEliminated ? '💀' : racer.avatar}
                                                </span>
                                                {/* Last roll badge */}
                                                {racer.lastRollDetail && currentMeter > 0 && !racer.isEliminated && (
                                                    <span className={`text-[10px] font-black px-1 rounded shadow ${
                                                        activeRaceType === 'mounted_archery'
                                                            ? racer.lastRollDetail.archeryHit
                                                                ? 'bg-emerald-500 text-black animate-bounce'
                                                                : 'bg-red-500 text-white'
                                                            : activeRaceType === 'steeplechase'
                                                            ? racer.lastRollDetail.obstacleCleared
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-rose-600 text-white animate-pulse'
                                                            : 'bg-amber-500 text-black'
                                                    }`}>
                                                        {activeRaceType === 'mounted_archery'
                                                            ? racer.lastRollDetail.archeryHit ? '+10🎯' : '-10❌'
                                                            : `+${racer.lastRollDetail.speedTotal}`}
                                                    </span>
                                                )}
                                            </motion.div>
                                        </div>

                                        {/* Score / Status on right */}
                                        <div className="w-24 shrink-0 text-right z-10 flex flex-col justify-center">
                                            <span className="font-black text-amber-300">
                                                {racer.totalPoints} <span className="text-[10px] text-stone-400">очк.</span>
                                            </span>
                                            {activeRaceType === 'steeplechase' && (
                                                <span className="text-[10px] text-stone-400">HP: {racer.hp}</span>
                                            )}
                                            {activeRaceType === 'mounted_archery' && (
                                                <span className="text-[10px] text-emerald-400">🎯{racer.targetsHit} ❌{racer.targetsMissed}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dual Cards: Player Dashboard & Chronicle Log */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Player Live Status & Dice Card */}
                        {playerRacer && (
                            <div className="bg-[#18120c] p-4 rounded-xl border border-amber-500/50 space-y-3">
                                <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🛡️</span>
                                        <div>
                                            <div className="font-bold text-amber-200">{playerRacer.name}</div>
                                            <div className="text-[11px] text-stone-400">Скакун: «{playerRacer.horseName}»</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-stone-400">Поточна позиція</div>
                                        <div className="text-lg font-black text-yellow-400">
                                            #{leaderboard.findIndex(r => r.id === 'player') + 1} з 9
                                        </div>
                                    </div>
                                </div>

                                {/* Stats & Modifiers Breakdown */}
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="bg-[#120d09] p-2 rounded-lg border border-stone-800">
                                        <div className="text-[10px] text-stone-400">Спритність</div>
                                        <div className="font-bold text-amber-300">+{playerRacer.agility}</div>
                                    </div>
                                    <div className="bg-[#120d09] p-2 rounded-lg border border-stone-800">
                                        <div className="text-[10px] text-stone-400">Їзда на коні</div>
                                        <div className="font-bold text-amber-300">+{playerRacer.horseRidingMod}</div>
                                    </div>
                                    <div className="bg-[#120d09] p-2 rounded-lg border border-stone-800">
                                        <div className="text-[10px] text-stone-400">
                                            {activeRaceType === 'steeplechase' ? 'Здоров\'я (HP)' : 'Стрільба з лука'}
                                        </div>
                                        <div className="font-bold text-emerald-400">
                                            {activeRaceType === 'steeplechase' ? `${playerRacer.hp}/${playerRacer.maxHp}` : `+${playerRacer.archeryMod}`}
                                        </div>
                                    </div>
                                </div>

                                {/* Points breakdown */}
                                <div className="p-2.5 rounded-lg bg-[#120d09] border border-amber-900/30 flex justify-between items-center text-xs">
                                    <span>Швидкість їзди: <strong className="text-amber-300">{playerRacer.ridingPoints}</strong></span>
                                    {activeRaceType === 'mounted_archery' && (
                                        <span>Стрільба: <strong className={playerRacer.archeryPoints >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                            {playerRacer.archeryPoints > 0 ? `+${playerRacer.archeryPoints}` : playerRacer.archeryPoints}
                                        </strong></span>
                                    )}
                                    <span className="text-sm font-black text-yellow-400">
                                        Разом: {playerRacer.totalPoints} очок
                                    </span>
                                </div>

                                {/* Last Roll details for player */}
                                {playerRacer.lastRollDetail && currentMeter > 0 && (
                                    <div className="p-2.5 rounded-lg bg-black/50 border border-stone-800 text-xs space-y-1">
                                        <div className="text-[11px] text-amber-300 font-bold">Останній кидок на {currentMeter}м:</div>
                                        <div className="text-stone-300">
                                            • Їзда: 1d20[{playerRacer.lastRollDetail.speedD20}] + {playerRacer.agility} + {playerRacer.horseRidingMod} = <strong className="text-amber-300">{playerRacer.lastRollDetail.speedTotal}</strong>
                                        </div>
                                        {activeRaceType === 'mounted_archery' && playerRacer.lastRollDetail.archeryD20 && (
                                            <div className="text-stone-300">
                                                • Постріл: 1d20[{playerRacer.lastRollDetail.archeryD20}] + {playerRacer.agility} + {playerRacer.archeryMod} = <strong className={playerRacer.lastRollDetail.archeryHit ? 'text-emerald-400' : 'text-red-400'}>{playerRacer.lastRollDetail.archeryTotal}</strong> vs DC (17+{playerRacer.lastRollDetail.archeryStepN}+{playerRacer.lastRollDetail.archeryD4}={playerRacer.lastRollDetail.archeryDc}) ➔ {playerRacer.lastRollDetail.archeryHit ? '🎯 +10 очок' : '❌ -10 очок'}
                                            </div>
                                        )}
                                        {activeRaceType === 'steeplechase' && playerRacer.lastRollDetail.obstacleDc && (
                                            <div className="text-stone-300">
                                                • Перешкода DC {playerRacer.lastRollDetail.obstacleDc}: {playerRacer.lastRollDetail.obstacleCleared ? '✅ Подолано!' : '💥 Збито!'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Race Log / Chronicle */}
                        <div className="bg-[#120d09] p-3 rounded-xl border border-stone-800 text-xs flex flex-col h-[230px]">
                            <div className="font-bold text-amber-300 border-b border-stone-800 pb-1.5 mb-2 flex items-center justify-between">
                                <span>📜 Хроніка забігу на {totalDistance}м</span>
                                <span className="text-[10px] text-stone-500">{raceLog.length} подій</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                                {raceLog.map(log => (
                                    <div
                                        key={log.id}
                                        className={`p-1.5 rounded border ${
                                            log.type === 'success'
                                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                                : log.type === 'danger'
                                                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                                : log.type === 'warning'
                                                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                                                : 'bg-stone-900/60 border-stone-800 text-stone-300'
                                        }`}
                                    >
                                        {log.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Control Bar / Results Modal */}
                <div className="p-4 bg-[#1a120b] border-t border-amber-900/50">
                    {!raceOver ? (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleStep}
                                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black text-sm shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Zap className="w-5 h-5 text-stone-950" />
                                <span>Продовжити забіг (+100 метрів) ➔ {currentMeter + 100}м</span>
                            </button>

                            <button
                                onClick={() => setAutoPlay(prev => !prev)}
                                className={`px-4 py-3.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
                                    autoPlay
                                        ? 'bg-red-900/80 hover:bg-red-800 text-red-200 border-red-500'
                                        : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                                }`}
                            >
                                {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                <span>{autoPlay ? 'Пауза' : 'Авто-забіг'}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-950/60 via-[#26190e] to-amber-950/60 border border-amber-500/60">
                            <div className="flex items-center gap-3">
                                <div className="text-4xl p-2 rounded-2xl bg-amber-500/20 border border-amber-400">
                                    {isPlayerWon ? '🏆' : '🏁'}
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-amber-200 font-serif">
                                        {isPlayerWon ? `🎉 ВИ ПЕРЕМОГЛИ У ЗАБІГУ НА ${totalDistance}м!` : `Переможець забігу: ${winner?.name}`}
                                    </h4>
                                    <p className="text-xs text-[#c4b5a0]">
                                        Переможний результат: <strong className="text-yellow-400">{winner?.totalPoints} очок</strong> на дистанції {totalDistance}м.
                                        {isPlayerWon && betAmount > 0 && ` Отримано виграш: +${betAmount * 3} 🪙!`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => initRace(activeRaceType)}
                                    className="px-4 py-2.5 rounded-xl bg-[#2b1e14] hover:bg-[#3d2a1b] text-amber-300 border border-amber-600/50 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Реванш</span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-stone-950 font-black text-xs shadow-lg cursor-pointer"
                                >
                                    Завершити та вийти
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default HorseRaceModal;

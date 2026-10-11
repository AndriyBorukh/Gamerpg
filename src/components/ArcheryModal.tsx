import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { OpponentData, WorldProgress } from '../types';
import { DEFAULT_PLAYER_STATS, recordRangedShot } from '../lib/worldData';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    Target, 
    Crosshair, 
    Trophy, 
    X, 
    Volume2, 
    VolumeX, 
    Sparkles, 
    HelpCircle, 
    RotateCcw,
    Zap,
    ChevronRight,
    Eye
} from 'lucide-react';

interface ArcheryModalProps {
    isOpen: boolean;
    opponent: OpponentData;
    progress: WorldProgress;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
    onProgressUpdate?: (newProgress: WorldProgress) => void;
}

interface ShotRecord {
    round: number;
    shooter: 'player' | 'opp';
    chosenAim: number;
    d25: number;
    d15: number;
    agility: number;
    rangedMod: number;
    term1: number;
    term2: number;
    distProduct: number;
    bowProf: number;
    visibilityD4: number;
    bowTerm: number;
    rawResult: number;
    points: number;
    isMiss: boolean;
    comment: string;
}

const VISIBILITY_CONDITIONS = [
    { value: 1, name: 'Густий туман / Сутінки', icon: '🌫️', desc: 'Видимість мінімальна (1d4 = 1)' },
    { value: 2, name: 'Хмарно / Сизий серпанок', icon: '🌥️', desc: 'Видимість помірна (1d4 = 2)' },
    { value: 3, name: 'Мінлива хмарність', icon: '⛅', desc: 'Видимість хороша (1d4 = 3)' },
    { value: 4, name: 'Ясне сонячне небо', icon: '☀️', desc: 'Ідеальна видимість (1d4 = 4)' }
];

export default function ArcheryModal({
    isOpen,
    opponent,
    progress,
    tavernName,
    onVictory,
    onDefeat,
    onClose,
    onProgressUpdate
}: ArcheryModalProps) {
    const [currentProgress, setCurrentProgress] = useState<WorldProgress>(progress);

    useEffect(() => {
        setCurrentProgress(progress);
    }, [progress]);

    const playerStats = currentProgress.playerStats || DEFAULT_PLAYER_STATS;

    // Derived RPG stats from persistent player progress
    const playerAgility = playerStats.agility;
    const totalBowShots = playerStats.totalBowShots || 0;
    const totalRangedShots = playerStats.totalRangedShots || 0;
    const playerBowProf = playerStats.bowProficiency || (1 + Math.floor(totalBowShots / 60));
    const playerRangedMod = playerStats.rangedShootingMod || (1 + Math.floor(totalRangedShots / 60));

    // Opponent stats derived
    const oppAgility = opponent.agility || 10;
    const oppRangedMod = opponent.type === 'champion' ? 3 : (opponent.difficulty === 'hard' ? 2 : 1);
    const oppBowProf = opponent.type === 'champion' ? 4 : (opponent.difficulty === 'hard' ? 2 : 1);

    const TOTAL_ROUNDS = 5;

    // Game state
    const [currentRound, setCurrentRound] = useState<number>(1);
    const [playerAim, setPlayerAim] = useState<number>(15); // chosen number
    const [roundVisibility, setRoundVisibility] = useState<number>(() => Math.floor(Math.random() * 4) + 1);
    const [shotsHistory, setShotsHistory] = useState<ShotRecord[]>([]);
    
    const [playerTotalScore, setPlayerTotalScore] = useState<number>(0);
    const [oppTotalScore, setOppTotalScore] = useState<number>(0);

    const [phase, setPhase] = useState<'player_aiming' | 'player_shooting' | 'opp_shooting' | 'round_summary' | 'game_over'>('player_aiming');
    const [currentShotLog, setCurrentShotLog] = useState<ShotRecord | null>(null);
    const [oppShotLog, setOppShotLog] = useState<ShotRecord | null>(null);
    const [levelUpNotice, setLevelUpNotice] = useState<string | null>(null);

    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | 'draw' | null>(null);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showHelp, setShowHelp] = useState<boolean>(false);

    // Sound Synthesizer
    const playTone = (type: 'draw' | 'release' | 'hit' | 'bullseye' | 'miss' | 'win' | 'lose') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            if (type === 'draw') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'release') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(450, now);
                osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'bullseye') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.setValueAtTime(880, now + 0.1); // A5
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === 'hit') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(220, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'miss') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'win') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.12);
                    gain.gain.setValueAtTime(0.15, now + i * 0.12);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.12);
                    osc.stop(now + i * 0.12 + 0.35);
                });
            } else if (type === 'lose') {
                [350, 310, 260, 195].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now + i * 0.12);
                    gain.gain.setValueAtTime(0.15, now + i * 0.12);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.12);
                    osc.stop(now + i * 0.12 + 0.3);
                });
            }
        } catch {
            // Audio context safely ignored
        }
    };

    // Initialize/Reset
    const resetMatch = () => {
        setCurrentRound(1);
        setPlayerAim(15);
        setShotsHistory([]);
        setPlayerTotalScore(0);
        setOppTotalScore(0);
        setCurrentShotLog(null);
        setOppShotLog(null);
        setGameResult(null);
        setLevelUpNotice(null);
        setPhase('player_aiming');
        setRoundVisibility(Math.floor(Math.random() * 4) + 1);
    };

    useEffect(() => {
        if (isOpen) {
            resetMatch();
        }
    }, [isOpen]);

    // Handle Player Shoot Action
    const handlePlayerShoot = () => {
        if (phase !== 'player_aiming') return;

        playTone('draw');
        setPhase('player_shooting');

        // Record shot in persistent RPG state
        const shotResult = recordRangedShot(currentProgress, 'bow');
        setCurrentProgress(shotResult.updatedProgress);
        onProgressUpdate?.(shotResult.updatedProgress);

        if (shotResult.bowLevelUp || shotResult.rangedLevelUp) {
            const notices: string[] = [];
            if (shotResult.bowLevelUp) notices.push(`Володіння луком зросло до ${shotResult.newBowProf}!`);
            if (shotResult.rangedLevelUp) notices.push(`Модифікатор стрільби зріс до +${shotResult.newRangedMod}!`);
            setLevelUpNotice(notices.join(' '));
        }

        // Formula:
        // обране число - (1д25(дальності) - спритність - модифікатор стрільби) * (1д15(дальності) - спритність - модифікатор стрільби) + (володіння луком / 1д4 (кубик видимості))
        const d25 = Math.floor(Math.random() * 25) + 1;
        const d15 = Math.floor(Math.random() * 15) + 1;
        const visD4 = roundVisibility;

        const currentAgi = playerAgility;
        const currentMod = shotResult.newRangedMod;
        const currentBowProf = shotResult.newBowProf;

        const term1 = d25 - currentAgi - currentMod;
        const term2 = d15 - currentAgi - currentMod;
        const distProduct = term1 * term2;
        const bowBonusTerm = Number((currentBowProf / visD4).toFixed(1));

        const rawResult = Number((playerAim - distProduct + (currentBowProf / visD4)).toFixed(1));
        const points = Math.max(0, Math.round(rawResult));
        const isMiss = points <= 0;

        let comment = '';
        if (isMiss) {
            comment = `⚠️ Промах! Стріла пішла повз мішень (підсумок ${rawResult} ≤ 0) -> 0 очок.`;
        } else if (points >= 25) {
            comment = `🎯 Фантастичний золотий постріл! Стріла розщепила яблучко (+${points} очок)!`;
        } else if (points >= 15) {
            comment = `🏹 Відмінне влучання у внутрішні кільця (+${points} очок)!`;
        } else {
            comment = `🎯 Влучання в зовнішнє кільце (+${points} очок).`;
        }

        const record: ShotRecord = {
            round: currentRound,
            shooter: 'player',
            chosenAim: playerAim,
            d25,
            d15,
            agility: currentAgi,
            rangedMod: currentMod,
            term1,
            term2,
            distProduct,
            bowProf: currentBowProf,
            visibilityD4: visD4,
            bowTerm: bowBonusTerm,
            rawResult,
            points,
            isMiss,
            comment
        };

        setTimeout(() => {
            playTone('release');
            setTimeout(() => {
                if (isMiss) playTone('miss');
                else if (points >= 15) playTone('bullseye');
                else playTone('hit');

                setCurrentShotLog(record);
                setShotsHistory(prev => [...prev, record]);
                setPlayerTotalScore(prev => prev + points);

                // Transition to Opponent Shoot
                setTimeout(() => {
                    handleOpponentShoot(points, record);
                }, 1800);
            }, 500);
        }, 300);
    };

    // Opponent Shoot Action (uses the exact same formula)
    const handleOpponentShoot = (playerPointsThisRound: number, pRecord: ShotRecord) => {
        setPhase('opp_shooting');

        // Opponent picks smart aim based on difficulty
        const oppAim = Math.floor(Math.random() * 11) + 12; // 12..22
        const oppD25 = Math.floor(Math.random() * 25) + 1;
        const oppD15 = Math.floor(Math.random() * 15) + 1;
        const oppVisD4 = roundVisibility;

        const oppTerm1 = oppD25 - oppAgility - oppRangedMod;
        const oppTerm2 = oppD15 - oppAgility - oppRangedMod;
        const oppDistProduct = oppTerm1 * oppTerm2;
        const oppBowBonusTerm = Number((oppBowProf / oppVisD4).toFixed(1));

        const oppRaw = Number((oppAim - oppDistProduct + (oppBowProf / oppVisD4)).toFixed(1));
        const oppPoints = Math.max(0, Math.round(oppRaw));
        const oppIsMiss = oppPoints <= 0;

        let oppComment = '';
        if (oppIsMiss) {
            oppComment = `⚠️ Стріла ${opponent.name} пролетіла повз мішень (0 очок)!`;
        } else if (oppPoints >= 20) {
            oppComment = `🎯 ${opponent.name} влучає майже в центр (+${oppPoints} очок)!`;
        } else {
            oppComment = `${opponent.name} поцілив у мішень (+${oppPoints} очок).`;
        }

        const oppRecord: ShotRecord = {
            round: currentRound,
            shooter: 'opp',
            chosenAim: oppAim,
            d25: oppD25,
            d15: oppD15,
            agility: oppAgility,
            rangedMod: oppRangedMod,
            term1: oppTerm1,
            term2: oppTerm2,
            distProduct: oppDistProduct,
            bowProf: oppBowProf,
            visibilityD4: oppVisD4,
            bowTerm: oppBowBonusTerm,
            rawResult: oppRaw,
            points: oppPoints,
            isMiss: oppIsMiss,
            comment: oppComment
        };

        setTimeout(() => {
            playTone('release');
            setTimeout(() => {
                if (oppIsMiss) playTone('miss');
                else if (oppPoints >= 15) playTone('bullseye');
                else playTone('hit');

                setOppShotLog(oppRecord);
                setShotsHistory(prev => [...prev, oppRecord]);
                const newOppTotal = oppTotalScore + oppPoints;
                setOppTotalScore(newOppTotal);

                const newPlayerTotal = playerTotalScore + pRecord.points;

                // Check if match finished
                if (currentRound >= TOTAL_ROUNDS) {
                    setPhase('game_over');
                    if (newPlayerTotal > newOppTotal) {
                        setGameResult('victory');
                        playTone('win');
                    } else if (newPlayerTotal < newOppTotal) {
                        setGameResult('defeat');
                        playTone('lose');
                    } else {
                        setGameResult('draw');
                    }
                } else {
                    setPhase('round_summary');
                }
            }, 500);
        }, 600);
    };

    const handleNextRound = () => {
        setCurrentRound(prev => prev + 1);
        setCurrentShotLog(null);
        setOppShotLog(null);
        setLevelUpNotice(null);
        setRoundVisibility(Math.floor(Math.random() * 4) + 1);
        setPhase('player_aiming');
    };

    if (!isOpen) return null;

    const currentVisObj = VISIBILITY_CONDITIONS.find(v => v.value === roundVisibility) || VISIBILITY_CONDITIONS[2];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div 
                initial={{ scale: 0.94, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 15 }}
                className="relative w-full max-w-4xl bg-[#18130e] border-2 border-[#c69214]/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7] my-auto"
            >
                {/* Top Header */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-[#2c1d12] via-[#1c140d] to-[#2c1d12] border-b border-[#c69214]/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 shadow-inner">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-black font-serif text-[#fbe3b5] tracking-wide">
                                    Змагання зі стрільби з лука
                                </h2>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                                    Раунд {currentRound} з {TOTAL_ROUNDS}
                                </span>
                            </div>
                            <div className="text-xs text-[#a6927d]">
                                {tavernName} • Суперник: <strong className="text-amber-300">{opponent.name}</strong> ({opponent.title})
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-2 rounded-lg bg-[#251a12] border border-[#523d2b] hover:bg-[#38281c] text-stone-300 transition"
                            title={soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                        </button>
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="p-2 rounded-lg bg-[#251a12] border border-[#523d2b] hover:bg-[#38281c] text-amber-300 transition"
                            title="Правила турніру"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-[#251a12] border border-[#523d2b] hover:bg-[#4a1c1c] text-stone-300 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Level Up Banner Notice */}
                {levelUpNotice && (
                    <div className="px-4 py-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black text-xs font-black flex items-center justify-center gap-2 shadow-md animate-pulse">
                        <Sparkles className="w-4 h-4" />
                        <span>{levelUpNotice}</span>
                    </div>
                )}

                {/* Scoreboard Bar */}
                <div className="grid grid-cols-2 bg-[#120e0a] border-b border-[#3b2b1d] p-3 text-center divide-x divide-[#3b2b1d]">
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-xs text-emerald-400 font-bold tracking-wider uppercase flex flex-wrap items-center justify-center gap-1.5">
                            <span>🏹 Лицар (Ви)</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                                Спритн: {playerAgility} • Мод: +{playerRangedMod} • Лук: {playerBowProf}
                            </span>
                        </div>
                        <div className="text-3xl font-black text-emerald-300 font-serif mt-0.5">
                            {playerTotalScore} <span className="text-sm font-sans font-normal text-stone-400">очок</span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                            Постріли: лук ({totalBowShots} шт, {totalBowShots % 60}/60) • всього ({totalRangedShots} шт, {totalRangedShots % 60}/60)
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        <div className="text-xs text-amber-400 font-bold tracking-wider uppercase flex flex-wrap items-center justify-center gap-1.5">
                            <span>🎯 {opponent.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300">
                                Спритн: {oppAgility} • Мод: +{oppRangedMod} • Лук: {oppBowProf}
                            </span>
                        </div>
                        <div className="text-3xl font-black text-amber-300 font-serif mt-0.5">
                            {oppTotalScore} <span className="text-sm font-sans font-normal text-stone-400">очок</span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                            Складність суперника: {opponent.difficulty}
                        </div>
                    </div>
                </div>

                {/* Main Arena Area */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 bg-gradient-to-b from-[#18130e] via-[#1d1712] to-[#140f0b]">
                    {/* Rules Drawer */}
                    {showHelp && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-3.5 bg-[#251b14] border border-amber-500/40 rounded-xl text-xs space-y-2 text-[#e5d5be]"
                        >
                            <div className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                                <Crosshair className="w-4 h-4" />
                                <span>Нові правила та формула стрільби:</span>
                            </div>
                            <div className="p-2.5 bg-[#17100b] rounded-lg border border-amber-500/30 font-mono text-xs text-amber-200">
                                Формула: <strong>обране число - (1d25 - спритність - модифікатор стрільби) * (1d15 - спритність - модифікатор стрільби) + (володіння луком / 1d4 (кубик видимості))</strong>
                            </div>
                            <p>
                                1. <strong>Обране число:</strong> Гравець вказує число прицілювання (наприклад, 1..30).
                            </p>
                            <p>
                                2. <strong>Кубики дальності:</strong> Кидаються два кубики дальності <strong>1d25</strong> та <strong>1d15</strong>. Від кожного віднімається ваша <strong>спритність ({playerAgility})</strong> та <strong>модифікатор стрільби (+{playerRangedMod})</strong>.
                            </p>
                            <p>
                                3. <strong>Кубик видимості (1d4):</strong> Визначає умови погоди в поточному раунді. Володіння луком ({playerBowProf}) ділиться на значення кубика видимості (1d4).
                            </p>
                            <p className="text-amber-200">
                                4. <strong>Прокачка:</strong> Модифікатор стрільби зростає на <strong>+1 кожні 60 пострілів</strong> з будь-якої далекобійної зброї. Володіння луком зростає на <strong>+1 кожні 60 пострілів</strong> з лука.
                            </p>
                        </motion.div>
                    )}

                    {/* Visibility & Range Conditions Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#140f0a] border border-[#3d2c1c] text-xs">
                        <div className="flex items-center gap-2 text-sky-300">
                            <span className="text-lg">{currentVisObj.icon}</span>
                            <div>
                                <span className="font-bold text-amber-300">Погода раунду:</span> {currentVisObj.name}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-stone-300 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-600/40 text-sky-300 flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-sky-400" />
                                <span>Кубик видимості 1d4: <strong>{roundVisibility}</strong></span>
                            </span>
                            <span>Дальність: <strong className="text-amber-300">1d25 • 1d15</strong></span>
                            <span>•</span>
                            <span>Спритність: <strong className="text-emerald-300">+{playerAgility}</strong></span>
                            <span>•</span>
                            <span>Мод: <strong className="text-teal-300">+{playerRangedMod}</strong></span>
                            <span>•</span>
                            <span>Лук: <strong className="text-yellow-300">{playerBowProf}</strong></span>
                        </div>
                    </div>

                    {/* Target and Bow Section */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Visual Target Board (Col 1-5) */}
                        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-[#120d09] border border-[#3d2b1c] rounded-2xl relative overflow-hidden">
                            <div className="text-xs font-bold text-stone-400 mb-2 tracking-wider uppercase">
                                Мішень турніру
                            </div>

                            {/* Concentric Target SVG */}
                            <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
                                {/* Rings */}
                                <div className="absolute inset-0 rounded-full border-4 border-stone-600 bg-stone-100 flex items-center justify-center shadow-inner">
                                    <div className="w-[85%] h-[85%] rounded-full border border-stone-800 bg-stone-900 flex items-center justify-center">
                                        <div className="w-[70%] h-[70%] rounded-full border border-sky-400 bg-sky-600 flex items-center justify-center">
                                            <div className="w-[55%] h-[55%] rounded-full border border-red-400 bg-red-600 flex items-center justify-center">
                                                <div className="w-[35%] h-[35%] rounded-full border-2 border-yellow-300 bg-yellow-400 flex items-center justify-center shadow-lg">
                                                    <span className="text-black font-black text-xs">ЦЕНТР</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Crosshairs */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                                    <div className="w-full h-0.5 bg-black/40"></div>
                                    <div className="h-full w-0.5 bg-black/40 absolute"></div>
                                </div>

                                {/* Arrow impact marker */}
                                {currentShotLog && (
                                    <motion.div 
                                        initial={{ scale: 3, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', damping: 12 }}
                                        className="absolute z-10 flex flex-col items-center pointer-events-none"
                                        style={{
                                            top: currentShotLog.isMiss 
                                                ? '88%'
                                                : `${Math.max(12, Math.min(82, 50 - (currentShotLog.points - 10) * 2.5))}%`,
                                            left: `${Math.max(15, Math.min(85, 50 + ((currentShotLog.d15 % 7) - 3) * 8))}%`
                                        }}
                                    >
                                        <div className="w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-ping absolute"></div>
                                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white shadow-md relative z-10 flex items-center justify-center text-[9px] font-black text-black">
                                            🎯
                                        </div>
                                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/80 text-emerald-300 border border-emerald-500/50 mt-1 whitespace-nowrap">
                                            {currentShotLog.isMiss ? 'ПРОМАХ' : `+${currentShotLog.points}`}
                                        </span>
                                    </motion.div>
                                )}
                            </div>

                            <div className="mt-3 text-center text-xs text-stone-400">
                                {phase === 'player_aiming' && (
                                    <span>Обране число прицілювання: <strong className="text-amber-300 text-sm">{playerAim}</strong></span>
                                )}
                                {phase === 'player_shooting' && (
                                    <span className="text-emerald-400 font-bold animate-pulse">Стріла летить до мішені...</span>
                                )}
                                {phase === 'opp_shooting' && (
                                    <span className="text-amber-300 font-bold animate-pulse">{opponent.name} натягує тятиву...</span>
                                )}
                            </div>
                        </div>

                        {/* Interactive Controls / Results Panel (Col 6-12) */}
                        <div className="md:col-span-7 flex flex-col gap-3">
                            {phase === 'player_aiming' && (
                                <div className="p-4 rounded-2xl bg-[#201811] border border-[#4d3725] flex flex-col gap-3.5 shadow-lg">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-amber-300 flex items-center gap-2">
                                            <Crosshair className="w-4 h-4 text-amber-400" />
                                            <span>Обране число (натяг прицілювання):</span>
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-base font-serif">
                                                {playerAim}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Number Selector Grid */}
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                                        {[1, 5, 8, 10, 12, 15, 18, 20, 25, 30].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setPlayerAim(val)}
                                                className={`py-2 rounded-xl font-bold font-serif text-xs transition ${
                                                    playerAim === val 
                                                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg scale-105 border-2 border-yellow-200' 
                                                        : 'bg-[#2d2015] hover:bg-[#3d2c1d] border border-[#523c28] text-stone-300'
                                                }`}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Aim Slider */}
                                    <div className="space-y-1">
                                        <input
                                            type="range"
                                            min="1"
                                            max="30"
                                            step="1"
                                            value={playerAim}
                                            onChange={(e) => setPlayerAim(parseInt(e.target.value))}
                                            className="w-full accent-amber-500 cursor-pointer h-2 bg-[#120d09] rounded-lg"
                                        />
                                        <div className="flex justify-between text-[10px] text-stone-400 px-1">
                                            <span>1 (Обережно)</span>
                                            <span>15 (Збалансовано)</span>
                                            <span>30 (Максимальний натяг)</span>
                                        </div>
                                    </div>

                                    {/* Live Formula Preview */}
                                    <div className="p-2.5 rounded-xl bg-[#140e0a] border border-[#3b2a1a] text-xs text-stone-300 space-y-1">
                                        <div className="text-[11px] text-amber-400 font-semibold flex items-center justify-between">
                                            <span>Попередній перегляд формули для обраного числа:</span>
                                            <span className="text-emerald-300">Видимість 1d4 = {roundVisibility}</span>
                                        </div>
                                        <div className="font-mono text-[11px] text-[#e0cfb8] bg-[#1a120c] p-2 rounded border border-[#2d1e13] leading-relaxed">
                                            [{playerAim}] - (1d25 - {playerAgility} - {playerRangedMod}) * (1d15 - {playerAgility} - {playerRangedMod}) + ({playerBowProf} / {roundVisibility})
                                        </div>
                                        <div className="text-[10px] text-stone-400">
                                            Володіння луком дає: +{(playerBowProf / roundVisibility).toFixed(1)} до підсумку
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        type="button"
                                        onClick={handlePlayerShoot}
                                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base tracking-wide shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
                                    >
                                        <Target className="w-5 h-5 text-emerald-200" />
                                        <span>ВИПУСТИТИ СТРІЛУ (ЗРОБИТИ ПОСТРІЛ)</span>
                                    </button>
                                </div>
                            )}

                            {/* Round / Shot Details Display */}
                            {(phase === 'player_shooting' || phase === 'opp_shooting' || phase === 'round_summary') && (
                                <div className="p-4 rounded-2xl bg-[#1c150e] border border-[#4a3422] flex flex-col gap-3 shadow-inner">
                                    <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between border-b border-[#3b291a] pb-2">
                                        <span>Результати раунду {currentRound}</span>
                                        {phase === 'round_summary' && (
                                            <span className="text-emerald-400 font-bold">Раунд завершено</span>
                                        )}
                                    </div>

                                    {/* Player Shot Calculation Breakdown */}
                                    {currentShotLog && (
                                        <div className="p-3 rounded-xl bg-[#120d09] border border-emerald-500/30 flex flex-col gap-1.5 text-xs">
                                            <div className="flex items-center justify-between font-bold text-emerald-300">
                                                <span>🏹 Ваш постріл:</span>
                                                <span className={`px-2 py-0.5 rounded text-xs ${currentShotLog.isMiss ? 'bg-red-950 text-red-400 border border-red-600/50' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'}`}>
                                                    {currentShotLog.isMiss ? 'ПРОМАХ (0 очок)' : `+${currentShotLog.points} очок`}
                                                </span>
                                            </div>

                                            <div className="font-mono text-[11px] text-stone-200 bg-[#18110a] p-2 rounded border border-[#2b1c11] leading-relaxed">
                                                <div className="text-stone-400 text-[10px] mb-0.5">
                                                    Формула: [{currentShotLog.chosenAim}] - (1d25({currentShotLog.d25}) - {currentShotLog.agility} - {currentShotLog.rangedMod}) * (1d15({currentShotLog.d15}) - {currentShotLog.agility} - {currentShotLog.rangedMod}) + ({currentShotLog.bowProf} / {currentShotLog.visibilityD4})
                                                </div>
                                                <div className="text-stone-300 text-[10px]">
                                                    = [{currentShotLog.chosenAim}] - ({currentShotLog.term1}) * ({currentShotLog.term2}) + {currentShotLog.bowTerm}
                                                </div>
                                                <div className="text-emerald-300 font-bold mt-0.5 text-xs">
                                                    = [{currentShotLog.chosenAim}] - ({currentShotLog.distProduct}) + {currentShotLog.bowTerm} = <span className="text-amber-300 text-sm font-black">{currentShotLog.rawResult}</span> → <strong className="text-emerald-300 text-sm">+{currentShotLog.points} очок</strong>
                                                </div>
                                            </div>

                                            <p className="text-[11px] text-stone-300 italic">
                                                {currentShotLog.comment}
                                            </p>
                                        </div>
                                    )}

                                    {/* Opponent Shot Calculation Breakdown */}
                                    {oppShotLog && (
                                        <div className="p-3 rounded-xl bg-[#120d09] border border-amber-500/30 flex flex-col gap-1.5 text-xs">
                                            <div className="flex items-center justify-between font-bold text-amber-300">
                                                <span>🎯 Постріл {opponent.name}:</span>
                                                <span className={`px-2 py-0.5 rounded text-xs ${oppShotLog.isMiss ? 'bg-red-950 text-red-400 border border-red-600/50' : 'bg-amber-950 text-amber-300 border border-amber-500/50'}`}>
                                                    {oppShotLog.isMiss ? 'ПРОМАХ (0 очок)' : `+${oppShotLog.points} очок`}
                                                </span>
                                            </div>

                                            <div className="font-mono text-[11px] text-stone-200 bg-[#18110a] p-2 rounded border border-[#2b1c11] leading-relaxed">
                                                <div className="text-stone-400 text-[10px] mb-0.5">
                                                    [{oppShotLog.chosenAim}] - ({oppShotLog.d25} - {oppShotLog.agility} - {oppShotLog.rangedMod}) * ({oppShotLog.d15} - {oppShotLog.agility} - {oppShotLog.rangedMod}) + ({oppShotLog.bowProf} / {oppShotLog.visibilityD4})
                                                </div>
                                                <div className="text-amber-300 font-bold mt-0.5 text-xs">
                                                    = [{oppShotLog.chosenAim}] - ({oppShotLog.distProduct}) + {oppShotLog.bowTerm} = <span className="text-amber-300 text-sm font-black">{oppShotLog.rawResult}</span> → <strong className="text-amber-300 text-sm">+{oppShotLog.points} очок</strong>
                                                </div>
                                            </div>

                                            <p className="text-[11px] text-stone-300 italic">
                                                {oppShotLog.comment}
                                            </p>
                                        </div>
                                    )}

                                    {phase === 'round_summary' && (
                                        <button
                                            type="button"
                                            onClick={handleNextRound}
                                            className="mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 text-black font-black text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                                        >
                                            <span>ПЕРЕЙТИ ДО РАУНДУ {currentRound + 1}</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Game Over Screen */}
                            {phase === 'game_over' && (
                                <motion.div 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`p-5 rounded-2xl border-2 flex flex-col items-center text-center gap-3 shadow-2xl ${
                                        gameResult === 'victory'
                                            ? 'bg-gradient-to-b from-[#182e18] to-[#0f1d0f] border-emerald-400/80 text-emerald-100'
                                            : gameResult === 'defeat'
                                            ? 'bg-gradient-to-b from-[#331414] to-[#1c0c0c] border-red-500/80 text-rose-100'
                                            : 'bg-gradient-to-b from-[#2a2216] to-[#17130c] border-amber-400/80 text-amber-100'
                                    }`}
                                >
                                    <div className="p-3 rounded-full bg-black/40 border border-current shadow-lg">
                                        {gameResult === 'victory' && <Trophy className="w-8 h-8 text-yellow-300 animate-bounce" />}
                                        {gameResult === 'defeat' && <X className="w-8 h-8 text-red-400" />}
                                        {gameResult === 'draw' && <Sparkles className="w-8 h-8 text-amber-300" />}
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black font-serif tracking-wide">
                                            {gameResult === 'victory' && '🏆 СЛАВНА ПЕРЕМОГА В ТУРНІРІ ЛУЧНИКІВ!'}
                                            {gameResult === 'defeat' && '💀 ПОРАЗКА НА СТРІЛЬБИЩІ!'}
                                            {gameResult === 'draw' && '⚖️ БОЙОВА НІЧИЯ!'}
                                        </h3>
                                        <div className="text-sm font-semibold mt-1">
                                            Рахунок матчу: <strong className="text-emerald-300 text-lg">{playerTotalScore}</strong> проти <strong className="text-amber-300 text-lg">{oppTotalScore}</strong>
                                        </div>
                                    </div>

                                    {gameResult === 'victory' && (
                                        <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/40 text-xs w-full text-emerald-200">
                                            <div className="font-bold text-amber-300 mb-1">Нагороди за перемогу:</div>
                                            <div className="flex justify-around font-bold">
                                                <span>🪙 +{opponent.rewards?.gold || 120} золота</span>
                                                <span>⭐ +{opponent.rewards?.xp || 150} XP</span>
                                                <span>👑 +{opponent.rewards?.reputation || 25} слави</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2.5 w-full mt-2">
                                        {gameResult === 'victory' ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onVictory();
                                                    onClose();
                                                }}
                                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-black font-black text-sm shadow-lg transition cursor-pointer"
                                            >
                                                ЗАБРАТИ НАГОРОДУ ТА ЗАКРИТИ
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (gameResult === 'defeat') onDefeat();
                                                    onClose();
                                                }}
                                                className="flex-1 py-3 rounded-xl bg-[#2e1a14] hover:bg-[#3d231b] border border-stone-600 text-stone-200 font-bold text-sm transition cursor-pointer"
                                            >
                                                ПОВЕРНУТИСЯ В ТАВЕРНУ
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={resetMatch}
                                            className="px-4 py-3 rounded-xl bg-[#251a12] hover:bg-[#38271b] border border-amber-500/50 text-amber-300 font-bold text-sm flex items-center gap-1.5 transition cursor-pointer"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span>Зіграти знову</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* History Shots Table */}
                    {shotsHistory.length > 0 && (
                        <div className="p-3 rounded-xl bg-[#120d09] border border-[#3b2b1d] overflow-x-auto text-xs">
                            <div className="text-[11px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider">
                                Протокол пострілів матчу (нова формула):
                            </div>
                            <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-[11px] pr-1">
                                {shotsHistory.map((s, idx) => (
                                    <div 
                                        key={idx}
                                        className={`p-2 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
                                            s.shooter === 'player' 
                                                ? 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500' 
                                                : 'bg-amber-950/40 text-amber-200 border-l-2 border-amber-500'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold">Раунд {s.round} ({s.shooter === 'player' ? 'Ви' : opponent.name}):</span>
                                            <span>[{s.chosenAim}] - ({s.d25} - {s.agility} - {s.rangedMod}) * ({s.d15} - {s.agility} - {s.rangedMod}) + ({s.bowProf} / {s.visibilityD4})</span>
                                        </div>
                                        <div className="font-bold flex items-center gap-2">
                                            <span>= {s.rawResult}</span>
                                            {s.isMiss ? <span className="text-red-400 px-1.5 py-0.5 rounded bg-red-950/80">ПРОМАХ (0)</span> : <span className="text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-950/80">+{s.points} очок</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

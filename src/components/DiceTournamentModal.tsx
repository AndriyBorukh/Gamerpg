import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { 
    Trophy, 
    Swords, 
    Shield, 
    RotateCcw, 
    Volume2, 
    VolumeX, 
    X, 
    HelpCircle,
    Crown,
    Flame,
    Zap,
    Users,
    ArrowRight
} from 'lucide-react';

interface DiceTournamentModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent: OpponentData;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

export interface TournamentFighter {
    id: string;
    name: string;
    avatar: string;
    isPlayer: boolean;
}

export interface TournamentMatch {
    id: string;
    round: 'qf' | 'sf' | 'f';
    fighter1: TournamentFighter;
    fighter2: TournamentFighter;
    winner: TournamentFighter | null;
    score1?: number; // damage dealt to fighter2
    score2?: number; // damage dealt to fighter1
}

const DEFAULT_TOURNAMENT_ROSTER: TournamentFighter[] = [
    { id: 'player', name: 'Ви (Герой)', avatar: '🧙‍♂️', isPlayer: true },
    { id: 'f1', name: 'Броніслав Вепр', avatar: '🐗', isPlayer: false },
    { id: 'f2', name: 'Катана Рен', avatar: '🥷', isPlayer: false },
    { id: 'f3', name: 'Берсерк Торвальд', avatar: '🪓', isPlayer: false },
    { id: 'f4', name: 'Валькірія Фрея', avatar: '🛡️', isPlayer: false },
    { id: 'f5', name: 'Лицар Ґотьє', avatar: '⚔️', isPlayer: false },
    { id: 'f6', name: 'Амазонка Талія', avatar: '🏹', isPlayer: false },
    { id: 'f7', name: 'Королівський Чемпіон', avatar: '👑', isPlayer: false },
];

export default function DiceTournamentModal({
    expectedXpReward = 200,
    isOpen,
    opponent,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: DiceTournamentModalProps) {
    const [bracketRound, setBracketRound] = useState<'qf' | 'sf' | 'f' | 'completed'>('qf');
    const [qfMatches, setQfMatches] = useState<TournamentMatch[]>([]);
    const [sfMatches, setSfMatches] = useState<TournamentMatch[]>([]);
    const [finalMatch, setFinalMatch] = useState<TournamentMatch | null>(null);
    const [champion, setChampion] = useState<TournamentFighter | null>(null);

    // Active match state (when player is fighting)
    const [activeMatch, setActiveMatch] = useState<TournamentMatch | null>(null);
    const [playerDamage, setPlayerDamage] = useState<number>(0);
    const [opponentDamage, setOpponentDamage] = useState<number>(0);
    const maxDamage = 3;

    // Dice values: null means not yet rolled in this round
    const [playerDieValue, setPlayerDieValue] = useState<number | null>(null);
    const [opponentDieValue, setOpponentDieValue] = useState<number | null>(null);

    // Current rolling status
    const [rollingEntity, setRollingEntity] = useState<'player' | 'opponent' | null>(null);
    const [activeAttacker, setActiveAttacker] = useState<'player' | 'opponent'>('player');

    // clashStep:
    // 'ready_attack' -> attacker needs to roll attack die
    // 'ready_defend' -> attacker has rolled, defender needs to roll defense die
    // 'clash_resolved' -> both have rolled, result calculated, ready for next round
    const [clashStep, setClashStep] = useState<'ready_attack' | 'ready_defend' | 'clash_resolved'>('ready_attack');

    const [duelLog, setDuelLog] = useState<string[]>([]);
    const [duelCommentary, setDuelCommentary] = useState<string>('Турнірний бій розпочато! Ваш перший випад!');

    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);

    const rollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (rollIntervalRef.current) {
                clearInterval(rollIntervalRef.current);
                rollIntervalRef.current = null;
            }
        };
    }, []);

    const playTone = (type: 'roll' | 'hit' | 'block' | 'win_match' | 'lose_match' | 'champ') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'roll') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'hit') {
                [600, 250, 100].forEach((f, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sawtooth';
                    o.frequency.value = f;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.05);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.15);
                    o.start(ctx.currentTime + i * 0.05);
                    o.stop(ctx.currentTime + i * 0.05 + 0.15);
                });
            } else if (type === 'block') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(700, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'win_match') {
                [523.25, 659.25, 783.99].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'sine';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);
                    o.start(ctx.currentTime + i * 0.08);
                    o.stop(ctx.currentTime + i * 0.08 + 0.15);
                });
            } else if (type === 'champ') {
                [523.25, 659.25, 783.99, 1046.50, 1318.5].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.type = 'triangle';
                    o.frequency.value = freq;
                    o.connect(g);
                    g.connect(ctx.destination);
                    g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
                    g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.35);
                    o.start(ctx.currentTime + i * 0.12);
                    o.stop(ctx.currentTime + i * 0.12 + 0.35);
                });
            }
        } catch {
            // Audio context disabled
        }
    };

    // Initialize Bracket
    const initTournament = () => {
        const roster = [...DEFAULT_TOURNAMENT_ROSTER];
        // Ensure opponent is in the roster
        roster[1] = { id: opponent.id, name: opponent.name, avatar: opponent.avatar, isPlayer: false };

        const qf: TournamentMatch[] = [
            { id: 'qf1', round: 'qf', fighter1: roster[0], fighter2: roster[1], winner: null },
            { id: 'qf2', round: 'qf', fighter1: roster[2], fighter2: roster[3], winner: null },
            { id: 'qf3', round: 'qf', fighter1: roster[4], fighter2: roster[5], winner: null },
            { id: 'qf4', round: 'qf', fighter1: roster[6], fighter2: roster[7], winner: null },
        ];

        setQfMatches(qf);
        setSfMatches([]);
        setFinalMatch(null);
        setChampion(null);
        setBracketRound('qf');

        // Start player's QF match
        startMatch(qf[0]);
    };

    useEffect(() => {
        if (isOpen) {
            initTournament();
        }
    }, [isOpen]);

    const startMatch = (match: TournamentMatch) => {
        setActiveMatch(match);
        setPlayerDamage(0);
        setOpponentDamage(0);
        setActiveAttacker('player');
        setPlayerDieValue(null);
        setOpponentDieValue(null);
        setRollingEntity(null);
        setClashStep('ready_attack');
        setDuelCommentary(`Бій: ${match.fighter1.name} проти ${match.fighter2.name}! Ваш перший випад!`);
        setDuelLog([`Розпочався бій: ${match.fighter1.name} vs ${match.fighter2.name}`]);
    };

    // Simulate non-player match
    const simulateMatch = (f1: TournamentFighter, f2: TournamentFighter): TournamentFighter => {
        return Math.random() > 0.5 ? f1 : f2;
    };

    // Sequential Step-by-Step Dice Roll in Active Match
    const handleRollAttack = () => {
        if (rollingEntity !== null || !activeMatch || champion || clashStep !== 'ready_attack') return;
        const currentEntity = activeAttacker; // 'player' or 'opponent'
        setRollingEntity(currentEntity);
        playTone('roll');

        let ticks = 0;
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = setInterval(() => {
            const randomVal = Math.floor(Math.random() * 20) + 1;
            if (currentEntity === 'player') {
                setPlayerDieValue(randomVal);
            } else {
                setOpponentDieValue(randomVal);
            }
            ticks++;

            if (ticks > 8) {
                if (rollIntervalRef.current) {
                    clearInterval(rollIntervalRef.current);
                    rollIntervalRef.current = null;
                }
                const finalAtk = Math.floor(Math.random() * 20) + 1;
                const oppFighter = activeMatch.fighter2;

                if (currentEntity === 'player') {
                    setPlayerDieValue(finalAtk);
                    setRollingEntity(null);
                    setClashStep('ready_defend');
                    setDuelCommentary(`⚔️ Ваша Атака: ${finalAtk}! Черга ${oppFighter.name} кинути кубик захисту...`);
                } else {
                    setOpponentDieValue(finalAtk);
                    setRollingEntity(null);
                    setClashStep('ready_defend');
                    setDuelCommentary(`⚔️ Атака ${oppFighter.name}: ${finalAtk}! Ваш час кинути кубик захисту (🛡️ d20)!`);
                }
            }
        }, 70);
    };

    const handleRollDefense = () => {
        if (rollingEntity !== null || !activeMatch || champion || clashStep !== 'ready_defend') return;
        const defendingEntity = activeAttacker === 'player' ? 'opponent' : 'player';
        setRollingEntity(defendingEntity);
        playTone('roll');

        let ticks = 0;
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = setInterval(() => {
            const randomVal = Math.floor(Math.random() * 20) + 1;
            if (defendingEntity === 'player') {
                setPlayerDieValue(randomVal);
            } else {
                setOpponentDieValue(randomVal);
            }
            ticks++;

            if (ticks > 8) {
                if (rollIntervalRef.current) {
                    clearInterval(rollIntervalRef.current);
                    rollIntervalRef.current = null;
                }
                const finalDef = Math.floor(Math.random() * 20) + 1;
                const oppFighter = activeMatch.fighter2;

                if (activeAttacker === 'player') {
                    // Player attacked, opponent defended
                    const pAtk = playerDieValue!;
                    setOpponentDieValue(finalDef);
                    setRollingEntity(null);
                    setClashStep('clash_resolved');

                    if (pAtk > finalDef) {
                        const newOppDamage = opponentDamage + 1;
                        setOpponentDamage(newOppDamage);
                        playTone('hit');
                        setDuelCommentary(`💥 ВЛУЧАННЯ! Ваша Атака (${pAtk}) пробила Захист ${oppFighter.name} (${finalDef})! (+1 пошкодження)`);
                        setDuelLog(prev => [`[Ваш випад]: ⚔️ Атака ${pAtk} > 🛡️ Захист ${finalDef} ➔ Пошкодження ${oppFighter.name}! (${newOppDamage}/3)`, ...prev.slice(0, 15)]);

                        if (newOppDamage >= maxDamage) {
                            handleMatchVictory(activeMatch.fighter1);
                            return;
                        }
                    } else {
                        playTone('block');
                        setDuelCommentary(`🛡️ БЛОК! ${oppFighter.name} відбив вашу Атаку (${pAtk} проти ${finalDef})!`);
                        setDuelLog(prev => [`[Ваш випад]: ⚔️ Атака ${pAtk} ≤ 🛡️ Захист ${finalDef} ➔ ${oppFighter.name} успішно захистився!`, ...prev.slice(0, 15)]);
                    }
                } else {
                    // Opponent attacked, player defended
                    const oAtk = opponentDieValue!;
                    setPlayerDieValue(finalDef);
                    setRollingEntity(null);
                    setClashStep('clash_resolved');

                    if (oAtk > finalDef) {
                        const newPlayDamage = playerDamage + 1;
                        setPlayerDamage(newPlayDamage);
                        playTone('hit');
                        setDuelCommentary(`🩸 ВАС ПОРАНЕНО! Атака ${oppFighter.name} (${oAtk}) подолала ваш Захист (${finalDef})!`);
                        setDuelLog(prev => [`[Випад ${oppFighter.name}]: ⚔️ Атака ${oAtk} > 🛡️ Захист ${finalDef} ➔ Ви отримали пошкодження! (${newPlayDamage}/3)`, ...prev.slice(0, 15)]);

                        if (newPlayDamage >= maxDamage) {
                            handleMatchDefeat(activeMatch.fighter2);
                            return;
                        }
                    } else {
                        playTone('block');
                        setDuelCommentary(`🛡️ ВІДБИТО! Ваш Захист (${finalDef}) витримав Атаку ${oppFighter.name} (${oAtk})!`);
                        setDuelLog(prev => [`[Випад ${oppFighter.name}]: ⚔️ Атака ${oAtk} ≤ 🛡️ Захист ${finalDef} ➔ Ви успішно заблокували удар!`, ...prev.slice(0, 15)]);
                    }
                }
            }
        }, 70);
    };

    const handleNextRound = () => {
        if (!activeMatch || champion) return;
        const nextAttacker = activeAttacker === 'player' ? 'opponent' : 'player';
        setActiveAttacker(nextAttacker);
        setPlayerDieValue(null);
        setOpponentDieValue(null);
        setRollingEntity(null);
        setClashStep('ready_attack');

        if (nextAttacker === 'player') {
            setDuelCommentary('Ваш раунд! Киньте кубик атаки (⚔️ d20).');
        } else {
            setDuelCommentary(`Раунд ${activeMatch.fighter2.name}! Супротивник готується до атаки.`);
        }
    };

    const handleMatchVictory = (playerWinner: TournamentFighter) => {
        playTone('win_match');
        if (activeMatch?.round === 'qf') {
            // Player won QF
            const updatedQF = qfMatches.map(m => m.id === 'qf1' ? { ...m, winner: playerWinner } : { ...m, winner: simulateMatch(m.fighter1, m.fighter2) });
            setQfMatches(updatedQF);

            // Setup Semi-Finals
            const sf1WinnerFighter = playerWinner;
            const sf2WinnerFighter = updatedQF[1].winner!;
            const sf3WinnerFighter = updatedQF[2].winner!;
            const sf4WinnerFighter = updatedQF[3].winner!;

            const newSF: TournamentMatch[] = [
                { id: 'sf1', round: 'sf', fighter1: sf1WinnerFighter, fighter2: sf2WinnerFighter, winner: null },
                { id: 'sf2', round: 'sf', fighter1: sf3WinnerFighter, fighter2: sf4WinnerFighter, winner: null },
            ];
            setSfMatches(newSF);
            setBracketRound('sf');
            startMatch(newSF[0]);
        } else if (activeMatch?.round === 'sf') {
            // Player won SF
            const updatedSF = sfMatches.map(m => m.id === 'sf1' ? { ...m, winner: playerWinner } : { ...m, winner: simulateMatch(m.fighter1, m.fighter2) });
            setSfMatches(updatedSF);

            // Setup Final
            const finalM: TournamentMatch = {
                id: 'final',
                round: 'f',
                fighter1: playerWinner,
                fighter2: updatedSF[1].winner!,
                winner: null
            };
            setFinalMatch(finalM);
            setBracketRound('f');
            startMatch(finalM);
        } else if (activeMatch?.round === 'f') {
            // Player won GRAND FINAL!
            const finalM = { ...activeMatch, winner: playerWinner };
            setFinalMatch(finalM);
            setChampion(playerWinner);
            setBracketRound('completed');
            playTone('champ');
        }
    };

    const handleMatchDefeat = (oppWinner: TournamentFighter) => {
        playTone('lose_match');
        // Player eliminated from tournament
        setChampion(oppWinner);
        setBracketRound('completed');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                className="relative w-full max-w-5xl bg-[#17100e] border-2 border-amber-500/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7] my-auto"
            >
                {/* Header */}
                <div className="bg-[#241512] border-b border-amber-500/40 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="text-2xl p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/40">
                            👑
                        </div>
                        <div>
                            <h2 className="text-lg font-black font-serif text-amber-200 flex items-center gap-2">
                                <span>Турнірний двобій на костях</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                                    8 Гравців
                                </span>
                            </h2>
                            <p className="text-xs text-amber-400/80">
                                Таверна «{tavernName}» • Етап: {bracketRound === 'qf' ? '1/4 Фіналу' : bracketRound === 'sf' ? '1/2 Фіналу' : bracketRound === 'f' ? 'Гранд-Фінал' : 'Завершено'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-amber-400 hover:text-amber-200 transition cursor-pointer"
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowRules(!showRules)}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-amber-400 hover:text-amber-200 transition cursor-pointer"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Rules */}
                {showRules && (
                    <div className="p-3 bg-[#120a08] border-b border-amber-500/30 text-xs text-stone-300 space-y-1">
                        <p className="font-bold text-amber-300">📜 Правила турнірного двобою на костях:</p>
                        <ul className="list-disc pl-5 space-y-0.5 text-stone-400">
                            <li>8 бійців змагаються за олімпійською сіткою (1/4 фіналу → 1/2 фіналу → Фінал).</li>
                            <li>
                                <strong className="text-amber-300">Ваш хід:</strong> Ви кидаєте <span className="text-rose-400 font-bold">кубик атаки (⚔️ d20)</span>, супротивник — <span className="text-sky-400 font-bold">кубик захисту (🛡️ d20)</span>.
                            </li>
                            <li>
                                <strong className="text-rose-300">Хід супротивника:</strong> Супротивник кидає <span className="text-rose-400 font-bold">кубик атаки (⚔️ d20)</span>, Ви — <span className="text-sky-400 font-bold">кубик захисту (🛡️ d20)</span>.
                            </li>
                            <li>При переважанні атаки наноситься 1 очко пошкоджень. Бій триває до <strong className="text-amber-300">3 пошкоджень</strong>.</li>
                            <li>Перемагає та забирає куш лише <strong className="text-amber-300">Чемпіон турніру</strong>!</li>
                        </ul>
                    </div>
                )}

                {/* Bracket Tree Overview */}
                <div className="bg-[#120a08] border-b border-stone-800 p-3 overflow-x-auto">
                    <div className="flex items-center justify-between min-w-[620px] gap-2 text-xs">
                        {/* 1/4 Finals */}
                        <div className="flex flex-col gap-1.5 flex-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">1/4 Фіналу</span>
                            {qfMatches.map((m, i) => (
                                <div key={m.id} className={`p-1.5 rounded-lg border text-[11px] flex flex-col gap-0.5 ${
                                    activeMatch?.id === m.id ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-400' : 'bg-[#1a0f0d] border-stone-800'
                                }`}>
                                    <div className={`flex justify-between ${m.winner?.id === m.fighter1.id ? 'font-bold text-amber-300' : ''}`}>
                                        <span className="truncate">{m.fighter1.avatar} {m.fighter1.name}</span>
                                        {m.winner?.id === m.fighter1.id && <span>✓</span>}
                                    </div>
                                    <div className={`flex justify-between ${m.winner?.id === m.fighter2.id ? 'font-bold text-amber-300' : ''}`}>
                                        <span className="truncate">{m.fighter2.avatar} {m.fighter2.name}</span>
                                        {m.winner?.id === m.fighter2.id && <span>✓</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <ArrowRight className="w-4 h-4 text-stone-600 flex-shrink-0" />

                        {/* 1/2 Finals */}
                        <div className="flex flex-col gap-3 flex-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">1/2 Фіналу</span>
                            {sfMatches.length > 0 ? sfMatches.map((m, i) => (
                                <div key={m.id} className={`p-2 rounded-lg border text-[11px] flex flex-col gap-0.5 ${
                                    activeMatch?.id === m.id ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-400' : 'bg-[#1a0f0d] border-stone-800'
                                }`}>
                                    <div className={`flex justify-between ${m.winner?.id === m.fighter1.id ? 'font-bold text-amber-300' : ''}`}>
                                        <span className="truncate">{m.fighter1.avatar} {m.fighter1.name}</span>
                                        {m.winner?.id === m.fighter1.id && <span>✓</span>}
                                    </div>
                                    <div className={`flex justify-between ${m.winner?.id === m.fighter2.id ? 'font-bold text-amber-300' : ''}`}>
                                        <span className="truncate">{m.fighter2.avatar} {m.fighter2.name}</span>
                                        {m.winner?.id === m.fighter2.id && <span>✓</span>}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-[11px] text-stone-600 italic p-3 border border-dashed border-stone-800 rounded-lg text-center">
                                    Очікують переможців 1/4
                                </div>
                            )}
                        </div>

                        <ArrowRight className="w-4 h-4 text-stone-600 flex-shrink-0" />

                        {/* Final & Trophy */}
                        <div className="flex flex-col gap-1.5 flex-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                                <Trophy className="w-3 h-3" /> Гранд-Фінал
                            </span>
                            {finalMatch ? (
                                <div className={`p-2 rounded-lg border text-[11px] flex flex-col gap-0.5 ${
                                    activeMatch?.id === finalMatch.id ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-400' : 'bg-[#1a0f0d] border-stone-800'
                                }`}>
                                    <div className={`flex justify-between ${finalMatch.winner?.id === finalMatch.fighter1.id ? 'font-bold text-amber-300' : ''}`}>
                                        <span className="truncate">{finalMatch.fighter1.avatar} {finalMatch.fighter1.name}</span>
                                        {finalMatch.winner?.id === finalMatch.fighter1.id && <span>✓</span>}
                                    </div>
                                    <div className={`flex justify-between ${finalMatch.winner?.id === finalMatch.fighter2.id ? 'font-bold text-amber-300' : ''}`}>
                                        <span className="truncate">{finalMatch.fighter2.avatar} {finalMatch.fighter2.name}</span>
                                        {finalMatch.winner?.id === finalMatch.fighter2.id && <span>✓</span>}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[11px] text-stone-600 italic p-3 border border-dashed border-stone-800 rounded-lg text-center">
                                    Очікує фіналістів
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Match Active Stage */}
                {activeMatch && !champion && (
                    <div className="p-4 flex flex-col items-center flex-1 bg-gradient-to-b from-[#18100e] via-[#110907] to-[#18100e]">
                        {/* Scoreboard for current match */}
                        <div className="w-full max-w-lg grid grid-cols-3 bg-[#1f120f] border border-amber-500/30 rounded-xl p-3 mb-4 text-center items-center">
                            {/* Fighter 1 (Player) */}
                            <div className="flex flex-col items-center">
                                <span className="text-xl">{activeMatch.fighter1.avatar}</span>
                                <span className="text-xs font-bold text-amber-300">{activeMatch.fighter1.name}</span>
                                <div className="flex gap-1 mt-1">
                                    {Array.from({ length: maxDamage }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${
                                                i < playerDamage ? 'bg-red-600 text-white' : 'bg-stone-800 border border-stone-700'
                                            }`}
                                        >
                                            {i < playerDamage ? '🩸' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Phase */}
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold text-stone-400">
                                    {activeMatch.round === 'qf' ? '1/4 Фіналу' : activeMatch.round === 'sf' ? '1/2 Фіналу' : 'Фінал'}
                                </span>
                                <div className={`mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-black border ${
                                    activeAttacker === 'player'
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                        : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                                }`}>
                                    {activeAttacker === 'player' ? '⚔️ Ваш випад' : `⚔️ Випад ${activeMatch.fighter2.name}`}
                                </div>
                            </div>

                            {/* Fighter 2 (Opponent) */}
                            <div className="flex flex-col items-center">
                                <span className="text-xl">{activeMatch.fighter2.avatar}</span>
                                <span className="text-xs font-bold text-rose-200">{activeMatch.fighter2.name}</span>
                                <div className="flex gap-1 mt-1">
                                    {Array.from({ length: maxDamage }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${
                                                i < opponentDamage ? 'bg-red-600 text-white' : 'bg-stone-800 border border-stone-700'
                                            }`}
                                        >
                                            {i < opponentDamage ? '🩸' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Step-by-Step Dice Arena */}
                        <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full max-w-md mb-4">
                            {/* Player Die */}
                            <div className={`p-3.5 rounded-xl border flex flex-col items-center transition-all ${
                                activeAttacker === 'player'
                                    ? (clashStep === 'ready_attack' ? 'bg-red-950/50 border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-950/50' : 'bg-red-950/25 border-red-900/60')
                                    : (clashStep === 'ready_defend' ? 'bg-sky-950/50 border-sky-400 ring-2 ring-sky-500/40 shadow-lg shadow-sky-950/50' : 'bg-sky-950/25 border-sky-900/60')
                            }`}>
                                <span className="text-xs font-bold text-amber-300 mb-1.5">
                                    {activeAttacker === 'player' ? 'Ваш кубик: Атака' : 'Ваш кубик: Захист'}
                                </span>
                                <div className="flex flex-col items-center">
                                    <motion.div
                                        animate={rollingEntity === 'player' ? { rotate: [0, 180, 360], scale: [1, 1.15, 1] } : {}}
                                        transition={{ repeat: rollingEntity === 'player' ? Infinity : 0, duration: 0.22 }}
                                        className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center text-white font-mono font-black text-xl shadow-lg transition-all ${
                                            activeAttacker === 'player'
                                                ? 'bg-gradient-to-br from-red-600 via-rose-700 to-red-900 border-red-400 shadow-red-500/20'
                                                : 'bg-gradient-to-br from-sky-600 via-blue-700 to-blue-900 border-sky-400 shadow-sky-500/20'
                                        }`}
                                    >
                                        {playerDieValue !== null ? (
                                            <span>{playerDieValue}</span>
                                        ) : (
                                            <span className="opacity-60">{rollingEntity === 'player' ? '🎲' : '?'}</span>
                                        )}
                                    </motion.div>
                                    <span className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${
                                        activeAttacker === 'player' ? 'text-red-400' : 'text-sky-400'
                                    }`}>
                                        {activeAttacker === 'player' ? <Swords className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                        {playerDieValue !== null 
                                            ? `d20 = ${playerDieValue}`
                                            : (activeAttacker === 'player' && clashStep === 'ready_attack' ? '👉 Ваш кидок' : (activeAttacker === 'opponent' && clashStep === 'ready_defend' ? '👉 Ваш захист' : 'Очікує'))}
                                    </span>
                                </div>
                            </div>

                            {/* Opponent Die */}
                            <div className={`p-3.5 rounded-xl border flex flex-col items-center transition-all ${
                                activeAttacker === 'opponent'
                                    ? (clashStep === 'ready_attack' ? 'bg-red-950/50 border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-950/50' : 'bg-red-950/25 border-red-900/60')
                                    : (clashStep === 'ready_defend' ? 'bg-sky-950/50 border-sky-400 ring-2 ring-sky-500/40 shadow-lg shadow-sky-950/50' : 'bg-sky-950/25 border-sky-900/60')
                            }`}>
                                <span className="text-xs font-bold text-stone-300 mb-1.5 truncate max-w-[140px]">
                                    {activeAttacker === 'opponent' ? `Атака ${activeMatch.fighter2.name}` : `Захист ${activeMatch.fighter2.name}`}
                                </span>
                                <div className="flex flex-col items-center">
                                    <motion.div
                                        animate={rollingEntity === 'opponent' ? { rotate: [0, -180, -360], scale: [1, 1.15, 1] } : {}}
                                        transition={{ repeat: rollingEntity === 'opponent' ? Infinity : 0, duration: 0.22 }}
                                        className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center text-white font-mono font-black text-xl shadow-lg transition-all ${
                                            activeAttacker === 'opponent'
                                                ? 'bg-gradient-to-br from-red-600 via-rose-700 to-red-900 border-red-400 shadow-red-500/20'
                                                : 'bg-gradient-to-br from-sky-600 via-blue-700 to-blue-900 border-sky-400 shadow-sky-500/20'
                                        }`}
                                    >
                                        {opponentDieValue !== null ? (
                                            <span>{opponentDieValue}</span>
                                        ) : (
                                            <span className="opacity-60">{rollingEntity === 'opponent' ? '🎲' : '?'}</span>
                                        )}
                                    </motion.div>
                                    <span className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${
                                        activeAttacker === 'opponent' ? 'text-red-400' : 'text-sky-400'
                                    }`}>
                                        {activeAttacker === 'opponent' ? <Swords className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                        {opponentDieValue !== null 
                                            ? `d20 = ${opponentDieValue}`
                                            : (activeAttacker === 'opponent' && clashStep === 'ready_attack' ? '👉 Кидок ворога' : (activeAttacker === 'player' && clashStep === 'ready_defend' ? '👉 Захист ворога' : 'Очікує'))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Commentary */}
                        <div className="w-full max-w-md p-2 rounded-xl bg-[#20120f] border border-amber-500/30 text-xs text-center font-bold text-amber-200 mb-3">
                            {duelCommentary}
                        </div>

                        {/* Step-by-Step Action Controls */}
                        <div className="w-full max-w-md flex flex-col items-center gap-2">
                            {clashStep === 'ready_attack' && (
                                <button
                                    onClick={handleRollAttack}
                                    disabled={rollingEntity !== null}
                                    className={`w-full py-3 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-lg active:scale-95 ${
                                        rollingEntity !== null
                                            ? 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                                            : activeAttacker === 'player'
                                            ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-400 hover:brightness-110 ring-2 ring-red-400/20'
                                            : 'bg-gradient-to-r from-orange-600 via-amber-600 to-red-700 text-white border-amber-400 hover:brightness-110 ring-2 ring-amber-400/20'
                                    }`}
                                >
                                    <Swords className="w-4 h-4" />
                                    <span>
                                        {rollingEntity !== null
                                            ? 'Кубик атаки котиться...'
                                            : activeAttacker === 'player'
                                            ? 'КРОК 1: КИНУТИ КУБИК АТАКИ (⚔️ d20)'
                                            : `КРОК 1: КИДОК АТАКИ ${activeMatch.fighter2.name} (⚔️ d20)`}
                                    </span>
                                </button>
                            )}

                            {clashStep === 'ready_defend' && (
                                <button
                                    onClick={handleRollDefense}
                                    disabled={rollingEntity !== null}
                                    className={`w-full py-3 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-lg active:scale-95 ${
                                        rollingEntity !== null
                                            ? 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                                            : activeAttacker === 'player'
                                            ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white border-sky-400 hover:brightness-110 ring-2 ring-sky-400/20'
                                            : 'bg-gradient-to-r from-sky-500 via-cyan-600 to-blue-700 text-white border-sky-300 hover:brightness-110 ring-2 ring-sky-400/30 animate-pulse'
                                    }`}
                                >
                                    <Shield className="w-4 h-4" />
                                    <span>
                                        {rollingEntity !== null
                                            ? 'Кубик захисту котиться...'
                                            : activeAttacker === 'player'
                                            ? `КРОК 2: КИДОК ЗАХИСТУ ${activeMatch.fighter2.name} (🛡️ d20)`
                                            : 'КРОК 2: ВІДБИТИ УДАР — ВАШ КИДОК ЗАХИСТУ (🛡️ d20)'}
                                    </span>
                                </button>
                            )}

                            {clashStep === 'clash_resolved' && (
                                <button
                                    onClick={handleNextRound}
                                    className="w-full py-3 px-6 rounded-xl font-black text-sm flex items-center justify-center gap-2 border bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-stone-950 border-amber-300 hover:brightness-110 ring-2 ring-amber-400/30 transition-all cursor-pointer shadow-lg active:scale-95"
                                >
                                    <span>
                                        ПРОДОВЖИТИ ДВОБІЙ ➔ ({activeAttacker === 'player' ? `Хід ${activeMatch.fighter2.name}` : 'Ваш хід'})
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Champion Modal Overlay */}
                {champion && (
                    <div className="p-8 flex flex-col items-center justify-center text-center flex-1 bg-gradient-to-b from-[#1c120f] via-[#110806] to-[#1c120f]">
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#231512] border-2 border-amber-500 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col items-center gap-3"
                        >
                            <div className="text-5xl">
                                {champion.isPlayer ? '👑 🏆 ⚔️' : '💀 🥀'}
                            </div>

                            <h3 className={`text-xl font-black font-serif ${
                                champion.isPlayer ? 'text-amber-300' : 'text-rose-400'
                            }`}>
                                {champion.isPlayer ? 'ЧЕМПІОН ТУРНІРУ ДВОБОЇВ!' : 'Вибуття з турніру!'}
                            </h3>

                            <p className="text-xs text-stone-300">
                                {champion.isPlayer 
                                    ? `Ви пройшли всю турнірну сітку, здолали 3 раунди та стали абсолютним Володарем Костей! Отримано чемпіонський трофей, золото та +${expectedXpReward} XP!`
                                    : `Чемпіоном турніру став ${champion.avatar} ${champion.name}. Спробуйте свої сили ще раз!`}
                            </p>

                            <div className="flex gap-2.5 w-full pt-2">
                                <button
                                    onClick={initTournament}
                                    className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Новий турнір</span>
                                </button>

                                <button
                                    onClick={champion.isPlayer ? onVictory : onDefeat}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shadow-lg ${
                                        champion.isPlayer
                                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 hover:brightness-110'
                                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                                    }`}
                                >
                                    {champion.isPlayer ? 'Забрати чемпіонський приз' : 'Залишити арену'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* History Log */}
                {duelLog.length > 0 && (
                    <div className="bg-[#0b0605] border-t border-stone-800 p-2 max-h-16 overflow-y-auto text-[10px] font-mono text-stone-400 space-y-0.5 scrollbar-thin scrollbar-thumb-stone-800">
                        {duelLog.map((entry, idx) => (
                            <div key={idx} className="leading-tight">
                                • {entry}
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}

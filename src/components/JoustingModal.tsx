import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData, WorldProgress } from '../types';
import { getSharedAudioContext } from '../lib/soundEffects';
import { DEFAULT_PLAYER_STATS } from '../lib/worldData';
import { getArmorById, getShieldById } from '../lib/armoryData';
import { 
    Shield, 
    Sword, 
    Award, 
    Trophy, 
    X, 
    Volume2, 
    VolumeX, 
    Sparkles, 
    HelpCircle, 
    RotateCcw,
    Zap,
    ChevronRight,
    Flame,
    Heart,
    Footprints
} from 'lucide-react';

interface JoustingModalProps {
    isOpen: boolean;
    opponent: OpponentData;
    progress: WorldProgress;
    tavernName: string;
    onVictory: () => void;
    onDefeat: () => void;
    onClose: () => void;
}

interface JoustPassResult {
    passNumber: number;
    // Player attacking opponent
    playerAimTarget: 'shield' | 'chest' | 'helm';
    playerAimHitMod: number;
    playerAimDamageMod: number;
    playerD20Attack: number;
    playerAgility: number;
    playerStrength: number;
    playerStatsAvg: number; // (спритність + сила) / 2
    playerHorsemanshipSkill: number; // навик верхової їзди
    playerAttackTotal: number;

    oppD20Defense: number;
    oppAgility: number;
    oppArmorModifier: number; // модифікатор броні
    oppDefenseStatsAvg: number; // (спритність + модифікатор броні) / 2
    oppHorsemanshipSkill: number; // навик верхової їзди
    oppDefenseTotal: number;

    playerHit: boolean;
    playerDamage: number;

    // Opponent attacking player
    oppAimTarget: 'shield' | 'chest' | 'helm';
    oppAimHitMod: number;
    oppAimDamageMod: number;
    oppD20Attack: number;
    oppAgilityAttack: number;
    oppStrengthAttack: number;
    oppStatsAvg: number; // (спритність + сила) / 2
    oppHorsemanshipSkillAttack: number;
    oppAttackTotal: number;

    playerD20Defense: number;
    playerAgilityDefense: number;
    playerArmorModifier: number; // модифікатор броні
    playerDefenseStatsAvg: number; // (спритність + модифікатор броні) / 2
    playerHorsemanshipSkillDefense: number;
    playerDefenseTotal: number;

    oppHit: boolean;
    oppDamage: number;

    comment: string;
}

export default function JoustingModal({
    isOpen,
    opponent,
    progress,
    tavernName,
    onVictory,
    onDefeat,
    onClose
}: JoustingModalProps) {
    const playerStats = progress.playerStats || DEFAULT_PLAYER_STATS;

    // Calculate player RPG stats & mods
    const playerStrength = playerStats.strength || 15;
    const playerAgility = playerStats.agility || 10;
    const playerMaxHp = (playerStats.baseHp || 100) + playerStrength;

    // Навик верхової їзди (Riding skill)
    const playerHorsemanshipSkill = playerStats.horseRidingSkill 
        ?? Math.max(1, Math.floor(playerAgility / 4) + 1);

    // Модифікатор броні: по стандарту 1 - але залежить від броні одягненої на персонажа
    const equippedArmorItem = playerStats.equippedArmor ? getArmorById(playerStats.equippedArmor) : null;
    const equippedShieldItem = playerStats.equippedShield ? getShieldById(playerStats.equippedShield) : null;
    const playerArmorModifier = playerStats.armorModifier 
        ?? equippedArmorItem?.armorModifier 
        ?? (equippedShieldItem ? Math.max(1, Math.floor(equippedShieldItem.blockBonus / 2)) : 1);

    // Opponent stats & mods
    const oppStrength = opponent.strength || 15;
    const oppAgility = opponent.agility || 10;
    const oppMaxHp = (opponent.baseHp || 100) + oppStrength;

    // Навик верхової їзди суперника
    const oppHorsemanshipSkill = Math.max(1, Math.floor(oppAgility / 4) + 1);

    // Модифікатор броні суперника (стандарт 1, підвищений для турнірних чемпіонів)
    const oppArmorModifier = opponent.type === 'champion'
        ? (opponent.rank === 1 ? 4 : opponent.rank === 2 ? 3 : 2)
        : (opponent.difficulty === 'master' ? 3 : opponent.difficulty === 'hard' || opponent.difficulty === 'expert' ? 2 : 1);

    // Combat State
    const [playerHp, setPlayerHp] = useState<number>(playerMaxHp);
    const [oppHp, setOppHp] = useState<number>(oppMaxHp);
    const [currentPass, setCurrentPass] = useState<number>(1);
    const [passHistory, setPassHistory] = useState<JoustPassResult[]>([]);
    
    const [playerTotalDamageDealt, setPlayerTotalDamageDealt] = useState<number>(0);
    const [oppTotalDamageDealt, setOppTotalDamageDealt] = useState<number>(0);

    const [lanceAimTarget, setLanceAimTarget] = useState<'helm' | 'shield' | 'chest'>('shield');
    const [phase, setPhase] = useState<'ready_charge' | 'charging' | 'impact' | 'pass_result' | 'match_end'>('ready_charge');
    const [currentPassLog, setCurrentPassLog] = useState<JoustPassResult | null>(null);

    const [gameResult, setGameResult] = useState<'victory' | 'defeat' | 'draw' | null>(null);
    const [unhorsedStatus, setUnhorsedStatus] = useState<'player' | 'opp' | 'none'>('none');
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [showHelp, setShowHelp] = useState<boolean>(false);

    // Audio Synthesizer for Jousting
    const playTone = (type: 'gallop' | 'impact_hit' | 'impact_block' | 'unhorse' | 'win' | 'lose') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            if (type === 'gallop') {
                for (let i = 0; i < 4; i++) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(90 + (i % 2) * 40, now + i * 0.14);
                    gain.gain.setValueAtTime(0.12, now + i * 0.14);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.1);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.14);
                    osc.stop(now + i * 0.14 + 0.1);
                }
            } else if (type === 'impact_hit') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(260, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'impact_block') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'unhorse') {
                [180, 140, 90, 45].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now + i * 0.1);
                    gain.gain.setValueAtTime(0.25, now + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.1);
                    osc.stop(now + i * 0.1 + 0.25);
                });
            } else if (type === 'win') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.14);
                    gain.gain.setValueAtTime(0.2, now + i * 0.14);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.14);
                    osc.stop(now + i * 0.14 + 0.35);
                });
            } else if (type === 'lose') {
                [330, 290, 220, 160].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now + i * 0.14);
                    gain.gain.setValueAtTime(0.18, now + i * 0.14);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.14);
                    osc.stop(now + i * 0.14 + 0.35);
                });
            }
        } catch {
            // Audio context safely ignored
        }
    };

    const resetJoust = () => {
        setPlayerHp(playerMaxHp);
        setOppHp(oppMaxHp);
        setCurrentPass(1);
        setPassHistory([]);
        setPlayerTotalDamageDealt(0);
        setOppTotalDamageDealt(0);
        setCurrentPassLog(null);
        setGameResult(null);
        setUnhorsedStatus('none');
        setPhase('ready_charge');
    };

    useEffect(() => {
        if (isOpen) {
            resetJoust();
        }
    }, [isOpen]);

    // Target aim modifiers: Shield (+3 hit), Chest (+2 hit, +4 dmg), Helm (-2 hit, +8 dmg)
    const getAimModifiers = (target: 'shield' | 'chest' | 'helm') => {
        switch (target) {
            case 'shield':
                return { hitMod: 3, dmgMod: 0, label: 'В щит', bonusText: '+3 до попадання' };
            case 'chest':
                return { hitMod: 2, dmgMod: 4, label: 'В нагрудник', bonusText: '+2 до попадання, +4 до пошкодження' };
            case 'helm':
                return { hitMod: -2, dmgMod: 8, label: 'В шолом', bonusText: '-2 до попадання, +8 до пошкодження' };
        }
    };

    // Handle Joust Charge Execution
    const handleExecuteCharge = () => {
        if (phase !== 'ready_charge') return;

        setPhase('charging');
        playTone('gallop');

        const playerAimMods = getAimModifiers(lanceAimTarget);

        // 1. Roll Player Attack: 1d20 (попадання) + ((спритність + сила) / 2) + навик верхової їзди + мод. прицілювання
        const playerD20Attack = Math.floor(Math.random() * 20) + 1;
        const playerStatsAvg = Math.floor((playerAgility + playerStrength) / 2);
        const playerAttackTotal = playerD20Attack + playerStatsAvg + playerHorsemanshipSkill + playerAimMods.hitMod;

        // 2. Roll Opponent Defense: 1d20 захисту + ((спритність + модифікатор броні) / 2) + навик верхової їзди
        const oppD20Defense = Math.floor(Math.random() * 20) + 1;
        const oppDefenseStatsAvg = Math.floor((oppAgility + oppArmorModifier) / 2);
        const oppDefenseTotal = oppD20Defense + oppDefenseStatsAvg + oppHorsemanshipSkill;

        // 3. Player Hit Calculation: Attack > Defense (має бути більшим за захист)
        const playerHit = playerAttackTotal > oppDefenseTotal;
        const playerDamage = playerHit ? Math.max(1, playerStrength + 8 + playerAimMods.dmgMod) : 0;

        // Opponent Aim Target choice
        const oppAimOptions: ('shield' | 'chest' | 'helm')[] = ['shield', 'chest', 'helm'];
        const oppAimTarget: 'shield' | 'chest' | 'helm' = opponent.type === 'champion'
            ? (Math.random() < 0.4 ? 'helm' : (Math.random() < 0.5 ? 'chest' : 'shield'))
            : oppAimOptions[Math.floor(Math.random() * oppAimOptions.length)];
        const oppAimMods = getAimModifiers(oppAimTarget);

        // 4. Roll Opponent Attack: 1d20 (попадання) + ((спритність + сила) / 2) + навик верхової їзди + мод. прицілювання
        const oppD20Attack = Math.floor(Math.random() * 20) + 1;
        const oppStatsAvg = Math.floor((oppAgility + oppStrength) / 2);
        const oppAttackTotal = oppD20Attack + oppStatsAvg + oppHorsemanshipSkill + oppAimMods.hitMod;

        // 5. Roll Player Defense: 1d20 захисту + ((спритність + модифікатор броні) / 2) + навик верхової їзди
        const playerD20Defense = Math.floor(Math.random() * 20) + 1;
        const playerDefenseStatsAvg = Math.floor((playerAgility + playerArmorModifier) / 2);
        const playerDefenseTotal = playerD20Defense + playerDefenseStatsAvg + playerHorsemanshipSkill;

        // 6. Opponent Hit Calculation: Attack > Defense (має бути більшим за захист)
        const oppHit = oppAttackTotal > playerDefenseTotal;
        const oppDamage = oppHit ? Math.max(1, oppStrength + 8 + oppAimMods.dmgMod) : 0;

        let comment = '';
        if (playerHit && oppHit) {
            comment = `💥 Обопільний нищівний удар! Ви завдали ${playerDamage} шкоди (${playerAimMods.label}), суперник завдав ${oppDamage} шкоди (${oppAimMods.label})!`;
        } else if (playerHit && !oppHit) {
            comment = `🛡️ Ваш спис пробив захист суперника (${playerAimMods.label}, ${playerDamage} шкоди), а випад ${opponent.name} відбито!`;
        } else if (!playerHit && oppHit) {
            comment = `⚔️ ${opponent.name} влучив у вас (${oppAimMods.label}, ${oppDamage} шкоди)! Ваш випад схибив.`;
        } else {
            comment = `🛡️ Обидва лицарі вправно відвели удари щитами! Жоден спис не пробив броню.`;
        }

        const passResult: JoustPassResult = {
            passNumber: currentPass,
            playerAimTarget: lanceAimTarget,
            playerAimHitMod: playerAimMods.hitMod,
            playerAimDamageMod: playerAimMods.dmgMod,
            playerD20Attack,
            playerAgility,
            playerStrength,
            playerStatsAvg,
            playerHorsemanshipSkill,
            playerAttackTotal,

            oppD20Defense,
            oppAgility,
            oppArmorModifier,
            oppDefenseStatsAvg,
            oppHorsemanshipSkill,
            oppDefenseTotal,

            playerHit,
            playerDamage,

            oppAimTarget,
            oppAimHitMod: oppAimMods.hitMod,
            oppAimDamageMod: oppAimMods.dmgMod,
            oppD20Attack,
            oppAgilityAttack: oppAgility,
            oppStrengthAttack: oppStrength,
            oppStatsAvg,
            oppHorsemanshipSkillAttack: oppHorsemanshipSkill,
            oppAttackTotal,

            playerD20Defense,
            playerAgilityDefense: playerAgility,
            playerArmorModifier,
            playerDefenseStatsAvg,
            playerHorsemanshipSkillDefense: playerHorsemanshipSkill,
            playerDefenseTotal,

            oppHit,
            oppDamage,

            comment
        };

        setTimeout(() => {
            setPhase('impact');
            if (playerHit || oppHit) {
                playTone('impact_hit');
            } else {
                playTone('impact_block');
            }

            const newOppHp = Math.max(0, oppHp - playerDamage);
            const newPlayerHp = Math.max(0, playerHp - oppDamage);
            const newPlayerTotalDmg = playerTotalDamageDealt + playerDamage;
            const newOppTotalDmg = oppTotalDamageDealt + oppDamage;

            setOppHp(newOppHp);
            setPlayerHp(newPlayerHp);
            setPlayerTotalDamageDealt(newPlayerTotalDmg);
            setOppTotalDamageDealt(newOppTotalDmg);
            setCurrentPassLog(passResult);
            setPassHistory(prev => [...prev, passResult]);

            // Check if knocked off horse (HP <= 0) or 3 passes completed
            setTimeout(() => {
                if (newOppHp <= 0 || newPlayerHp <= 0 || currentPass >= 3) {
                    setPhase('match_end');
                    if (newOppHp <= 0 && newPlayerHp > 0) {
                        setUnhorsedStatus('opp');
                        setGameResult('victory');
                        playTone('unhorse');
                        setTimeout(() => playTone('win'), 400);
                    } else if (newPlayerHp <= 0 && newOppHp > 0) {
                        setUnhorsedStatus('player');
                        setGameResult('defeat');
                        playTone('unhorse');
                        setTimeout(() => playTone('lose'), 400);
                    } else if (newPlayerHp <= 0 && newOppHp <= 0) {
                        setUnhorsedStatus('player');
                        setGameResult('draw');
                    } else {
                        // Decided by damage after 3 passes
                        if (newPlayerTotalDmg > newOppTotalDmg) {
                            setGameResult('victory');
                            playTone('win');
                        } else if (newPlayerTotalDmg < newOppTotalDmg) {
                            setGameResult('defeat');
                            playTone('lose');
                        } else {
                            setGameResult('draw');
                        }
                    }
                } else {
                    setPhase('pass_result');
                }
            }, 1200);
        }, 1000);
    };

    const handleNextPass = () => {
        setCurrentPass(prev => prev + 1);
        setCurrentPassLog(null);
        setPhase('ready_charge');
    };

    if (!isOpen) return null;

    const playerHpPercent = Math.max(0, Math.round((playerHp / Math.max(1, playerMaxHp)) * 100));
    const oppHpPercent = Math.max(0, Math.round((oppHp / Math.max(1, oppMaxHp)) * 100));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div 
                initial={{ scale: 0.94, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 15 }}
                className="relative w-full max-w-4xl bg-[#17110c] border-2 border-[#d4af37]/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f5ebd7] my-auto"
            >
                {/* Header */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-[#2e1c10] via-[#1d140d] to-[#2e1c10] border-b border-[#d4af37]/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-400 shadow-inner">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-black font-serif text-[#fbe3b5] tracking-wide">
                                    Лицарський Джостинг (Турнір на списах)
                                </h2>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
                                    Зіткнення {currentPass} з 3
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
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                        </button>
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="p-2 rounded-lg bg-[#251a12] border border-[#523d2b] hover:bg-[#38281c] text-amber-300 transition"
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

                {/* HP & Joust Status Bar */}
                <div className="grid grid-cols-2 bg-[#120e0a] border-b border-[#3b2b1d] p-3 text-center divide-x divide-[#3b2b1d]">
                    {/* Player Knight Box */}
                    <div className="px-2 flex flex-col items-center">
                        <div className="flex items-center justify-between w-full text-xs font-bold mb-1">
                            <span className="text-emerald-400 flex items-center gap-1">
                                <span>🏇 Лицар (Ви)</span>
                            </span>
                            <span className="text-stone-300 font-mono">{playerHp} / {playerMaxHp} HP</span>
                        </div>
                        <div className="w-full h-3.5 bg-black/60 rounded-full border border-emerald-500/40 p-0.5 overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: `${playerHpPercent}%` }}
                            />
                        </div>
                        <div className="text-[11px] text-stone-400 mt-1 flex gap-2">
                            <span>Шкода списом: <strong className="text-amber-300">{playerStrength + 8}</strong></span>
                            <span>•</span>
                            <span>Завдано шкоди: <strong className="text-emerald-400">{playerTotalDamageDealt}</strong></span>
                        </div>
                    </div>

                    {/* Opponent Knight Box */}
                    <div className="px-2 flex flex-col items-center">
                        <div className="flex items-center justify-between w-full text-xs font-bold mb-1">
                            <span className="text-amber-400 flex items-center gap-1">
                                <span>🛡️ {opponent.name}</span>
                            </span>
                            <span className="text-stone-300 font-mono">{oppHp} / {oppMaxHp} HP</span>
                        </div>
                        <div className="w-full h-3.5 bg-black/60 rounded-full border border-amber-500/40 p-0.5 overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                                style={{ width: `${oppHpPercent}%` }}
                            />
                        </div>
                        <div className="text-[11px] text-stone-400 mt-1 flex gap-2">
                            <span>Шкода списом: <strong className="text-amber-300">{oppStrength + 8}</strong></span>
                            <span>•</span>
                            <span>Завдано шкоди: <strong className="text-amber-400">{oppTotalDamageDealt}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Main Arena Field */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4 bg-gradient-to-b from-[#18120c] via-[#1c150f] to-[#120d08]">
                    {/* Rules Helper */}
                    {showHelp && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-3.5 bg-[#251b14] border border-amber-500/40 rounded-xl text-xs space-y-1.5 text-[#e5d5be]"
                        >
                            <div className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                                <Shield className="w-4 h-4" />
                                <span>Правила та формули Лицарського Джостингу:</span>
                            </div>
                            <p>
                                1. <strong>Мета двобою:</strong> Збити супротивника з коня (<strong>HP ≤ 0</strong>) або завдати більшої сумарної шкоди за <strong>3 атаки (зіткнення)</strong>.
                            </p>
                            <p>
                                2. <strong>Кидок атаки (попадання):</strong> <code className="text-amber-300 font-mono bg-black/40 px-1 py-0.5 rounded">1d20 + ((спритність + сила) / 2) + навик верхової їзди + мод. точки прицілювання</code>.
                            </p>
                            <p>
                                3. <strong>Захист:</strong> <code className="text-sky-300 font-mono bg-black/40 px-1 py-0.5 rounded">1d20 захисту + ((спритність + модифікатор броні) / 2) + навик верхової їзди</code>.
                            </p>
                            <p>
                                4. <strong>Умова влучання:</strong> Атака має бути <strong className="text-emerald-300">більшою за Захист (&gt;)</strong>.
                            </p>
                            <p>
                                5. <strong>Модифікатор броні:</strong> за стандартом <code className="text-amber-300 font-mono">1</code>, але залежить від одягненої броні на персонажі (поточний: <strong className="text-amber-200">{playerArmorModifier}</strong>).
                            </p>
                            <p>
                                6. <strong>Базове пошкодження:</strong> <code className="text-red-300 font-mono bg-black/40 px-1 py-0.5 rounded">Сила + 8 + бонус шкоди точки прицілювання</code>.
                            </p>
                            <div className="p-2 bg-[#17100a] rounded-lg border border-amber-500/30 text-amber-200">
                                <strong>🎯 Точки прицілювання списом:</strong>
                                <ul className="list-disc list-inside mt-1 space-y-0.5">
                                    <li><strong className="text-emerald-300">В щит:</strong> +3 до попадання</li>
                                    <li><strong className="text-amber-300">В нагрудник:</strong> +2 до попадання +4 до пошкодження</li>
                                    <li><strong className="text-red-400">В шолом:</strong> -2 до попадання +8 до пошкодження</li>
                                </ul>
                            </div>
                        </motion.div>
                    )}

                    {/* Jousting Arena Animation Box */}
                    <div className="p-4 rounded-2xl bg-[#110d09] border border-[#3b2b1d] relative min-h-[160px] flex flex-col justify-between overflow-hidden shadow-inner">
                        {/* Sand/Grass Arena Track */}
                        <div className="absolute inset-x-0 bottom-4 h-12 bg-[#2d2216] border-y-2 border-[#473623] flex items-center justify-center">
                            {/* Wooden Tilt Barrier */}
                            <div className="w-full h-2 bg-[#61472a] border-y border-[#82613b]"></div>
                        </div>

                        {/* Pass Indicator */}
                        <div className="flex justify-between items-center z-10 text-xs text-stone-400">
                            <span className="font-bold text-amber-300 flex items-center gap-1">
                                <Footprints className="w-4 h-4" />
                                <span>Ристалище турніру</span>
                            </span>
                            <span>Зіткнення {currentPass} з 3</span>
                        </div>

                        {/* Animated Knights Galloping */}
                        <div className="relative h-24 flex items-center justify-between px-6 z-10">
                            {/* Player Knight */}
                            <motion.div 
                                animate={{
                                    x: phase === 'charging' ? '180px' : (phase === 'impact' ? '150px' : '0px'),
                                    rotate: unhorsedStatus === 'player' ? 90 : (phase === 'charging' ? [0, -4, 0, 4, 0] : 0)
                                }}
                                transition={{ duration: phase === 'charging' ? 0.9 : 0.3 }}
                                className="flex flex-col items-center"
                            >
                                <div className="text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]">
                                    🏇
                                </div>
                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                                    Ви
                                </span>
                            </motion.div>

                            {/* Clash Effect at Center */}
                            <AnimatePresence>
                                {phase === 'impact' && (
                                    <motion.div 
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1.5, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                                    >
                                        <div className="text-4xl animate-spin">💥</div>
                                        <span className="text-xs font-black text-yellow-300 bg-black/80 px-2 py-0.5 rounded border border-yellow-400 shadow-lg">
                                            УДАР СПИСІВ!
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Opponent Knight */}
                            <motion.div 
                                animate={{
                                    x: phase === 'charging' ? '-180px' : (phase === 'impact' ? '-150px' : '0px'),
                                    rotate: unhorsedStatus === 'opp' ? -90 : (phase === 'charging' ? [0, 4, 0, -4, 0] : 0)
                                }}
                                transition={{ duration: phase === 'charging' ? 0.9 : 0.3 }}
                                className="flex flex-col items-center"
                            >
                                <div className="text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] scale-x-[-1]">
                                    🏇
                                </div>
                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-950/90 text-amber-300 border border-amber-500/40">
                                    {opponent.name}
                                </span>
                            </motion.div>
                        </div>

                        {/* Status Line */}
                        <div className="text-center text-xs text-stone-300 z-10 pt-1">
                            {phase === 'ready_charge' && 'Оберіть прицілювання та спрямуйте бойового коня в атаку!'}
                            {phase === 'charging' && <span className="text-amber-400 font-bold animate-pulse">Лицарі несуться назустріч один одному на повному галопі!</span>}
                            {phase === 'impact' && <span className="text-red-400 font-bold">Зіткнення списів на бар\'єрі!</span>}
                        </div>
                    </div>

                    {/* Controls & Roll Action Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Player Technique & Action (Col 1-6) */}
                        <div className="md:col-span-6 flex flex-col gap-3 p-4 rounded-2xl bg-[#1f160f] border border-[#4d3725] shadow-lg">
                            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                                <span>Тактика на зіткнення {currentPass}</span>
                                <span className="text-stone-300 text-[11px] bg-black/40 px-2 py-0.5 rounded border border-[#523d2b]">
                                    Шкода: <strong className="text-amber-400">{playerStrength + 8 + getAimModifiers(lanceAimTarget).dmgMod}</strong>
                                </span>
                            </div>

                            {/* Target Aim Selection */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-stone-200 font-semibold">
                                        Точка прицілювання списом:
                                    </label>
                                    <span className="text-[11px] font-bold text-yellow-300">
                                        {getAimModifiers(lanceAimTarget).bonusText}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLanceAimTarget('shield')}
                                        className={`py-2 px-1.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                                            lanceAimTarget === 'shield'
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-2 border-emerald-300 shadow-md ring-2 ring-emerald-500/40'
                                                : 'bg-[#2b1f15] hover:bg-[#38291c] border border-[#523d2b] text-stone-300'
                                        }`}
                                    >
                                        <span className="text-base">🛡️</span>
                                        <span className="font-extrabold">В щит</span>
                                        <span className="text-[10px] text-emerald-300 font-mono">+3 до влучання</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setLanceAimTarget('chest')}
                                        className={`py-2 px-1.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                                            lanceAimTarget === 'chest'
                                                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-2 border-yellow-300 shadow-md ring-2 ring-amber-500/40'
                                                : 'bg-[#2b1f15] hover:bg-[#38291c] border border-[#523d2b] text-stone-300'
                                        }`}
                                    >
                                        <span className="text-base">🥋</span>
                                        <span className="font-extrabold">В нагрудник</span>
                                        <span className="text-[10px] text-amber-200 font-mono">+2 влуч. / +4 шкоди</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setLanceAimTarget('helm')}
                                        className={`py-2 px-1.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                                            lanceAimTarget === 'helm'
                                                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-2 border-rose-300 shadow-md ring-2 ring-rose-500/40'
                                                : 'bg-[#2b1f15] hover:bg-[#38291c] border border-[#523d2b] text-stone-300'
                                        }`}
                                    >
                                        <span className="text-base">🪖</span>
                                        <span className="font-extrabold">В шолом</span>
                                        <span className="text-[10px] text-rose-300 font-mono">-2 влуч. / +8 шкоди</span>
                                    </button>
                                </div>
                            </div>

                            {/* Stat Formula Preview */}
                            <div className="p-2.5 rounded-xl bg-[#140e0a] border border-[#3b2a1a] text-xs text-stone-300 space-y-1">
                                <div className="text-[11px] text-amber-400 font-semibold flex items-center justify-between">
                                    <span>Ваші бойові модифікатори:</span>
                                    <span>Їзда: +{playerHorsemanshipSkill} • Броня: +{playerArmorModifier}</span>
                                </div>
                                <div className="text-[10px] text-stone-300 font-mono leading-relaxed">
                                    Атака: 1d20 + {Math.floor((playerAgility + playerStrength) / 2)} ((спритн.+сила)/2) + {playerHorsemanshipSkill} (їзда) <span className="text-amber-300 font-bold">[{getAimModifiers(lanceAimTarget).bonusText}]</span><br/>
                                    Захист: 1d20 + {Math.floor((playerAgility + playerArmorModifier) / 2)} ((спритн.+мод.броні)/2) + {playerHorsemanshipSkill} (їзда)
                                </div>
                            </div>

                            {/* Action Button */}
                            {phase === 'ready_charge' && (
                                <button
                                    type="button"
                                    onClick={handleExecuteCharge}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-700 hover:from-red-500 hover:to-amber-500 text-white font-black text-base tracking-wide shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
                                >
                                    <Sword className="w-5 h-5 text-yellow-300" />
                                    <span>СПРЯМУВАТИ КОНЯ В АТАКУ!</span>
                                </button>
                            )}

                            {phase === 'pass_result' && (
                                <button
                                    type="button"
                                    onClick={handleNextPass}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 text-black font-black text-sm flex items-center justify-center gap-2 transition shadow-lg"
                                >
                                    <span>ПЕРЕЙТИ ДО ЗІТКНЕННЯ {currentPass + 1}</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Combat Dice Breakdown Log (Col 7-12) */}
                        <div className="md:col-span-6 flex flex-col gap-2 p-4 rounded-2xl bg-[#1c150e] border border-[#4a3422] shadow-inner">
                            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider border-b border-[#3b291a] pb-1.5 flex items-center justify-between">
                                <span>Протокол зіткнення {currentPass}</span>
                                {currentPassLog && (
                                    <span className="text-[11px] text-stone-400">
                                        {currentPassLog.playerHit ? '💥 Влучання' : '🛡️ Відбито'}
                                    </span>
                                )}
                            </div>

                            {currentPassLog ? (
                                <div className="space-y-2 text-xs">
                                    {/* Player Attack Breakdown */}
                                    <div className="p-2.5 rounded-xl bg-[#120d09] border border-emerald-500/30 flex flex-col gap-1">
                                        <div className="flex items-center justify-between font-bold text-emerald-300">
                                            <span className="flex items-center gap-1.5">
                                                <span>⚔️ Ваша атака</span>
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-200">
                                                    {getAimModifiers(currentPassLog.playerAimTarget).label} ({currentPassLog.playerAimHitMod >= 0 ? `+${currentPassLog.playerAimHitMod}` : currentPassLog.playerAimHitMod} влуч.)
                                                </span>
                                            </span>
                                            <span className={currentPassLog.playerHit ? 'text-emerald-400 font-bold' : 'text-stone-400'}>
                                                {currentPassLog.playerHit ? `ВЛУЧАННЯ (-${currentPassLog.playerDamage} HP)` : 'ВІДБИТО'}
                                            </span>
                                        </div>
                                        <div className="font-mono text-[10px] text-stone-300 bg-[#17100a] p-1.5 rounded leading-relaxed">
                                            Атака: 1d20[{currentPassLog.playerD20Attack}] + {currentPassLog.playerStatsAvg} ((спритн.+сила)/2) + {currentPassLog.playerHorsemanshipSkill} (їзда) {currentPassLog.playerAimHitMod >= 0 ? `+ ${currentPassLog.playerAimHitMod}` : `- ${Math.abs(currentPassLog.playerAimHitMod)}`} (приціл) = <strong className="text-emerald-300">{currentPassLog.playerAttackTotal}</strong><br/>
                                            Захист суперника: 1d20[{currentPassLog.oppD20Defense}] + {currentPassLog.oppDefenseStatsAvg} ((спритн.+мод.броні)/2) + {currentPassLog.oppHorsemanshipSkill} (їзда) = <strong className="text-amber-300">{currentPassLog.oppDefenseTotal}</strong><br/>
                                            Умова: {currentPassLog.playerAttackTotal} &gt; {currentPassLog.oppDefenseTotal} → <strong className={currentPassLog.playerHit ? 'text-emerald-400' : 'text-stone-400'}>{currentPassLog.playerHit ? 'ВЛУЧАННЯ' : 'НЕ ВЛУЧИВ (ВІДБИТО)'}</strong>
                                            {currentPassLog.playerHit && (
                                                <div className="text-emerald-300 font-sans mt-0.5 text-[10px]">
                                                    💥 Шкода: {playerStrength} (сила) + 8 (спис) + {currentPassLog.playerAimDamageMod} (бонус прицілу) = <strong>{currentPassLog.playerDamage} HP</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Opponent Attack Breakdown */}
                                    <div className="p-2.5 rounded-xl bg-[#120d09] border border-amber-500/30 flex flex-col gap-1">
                                        <div className="flex items-center justify-between font-bold text-amber-300">
                                            <span className="flex items-center gap-1.5">
                                                <span>🛡️ Атака {opponent.name}</span>
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/40 text-amber-200">
                                                    {getAimModifiers(currentPassLog.oppAimTarget).label}
                                                </span>
                                            </span>
                                            <span className={currentPassLog.oppHit ? 'text-red-400 font-bold' : 'text-emerald-300 font-bold'}>
                                                {currentPassLog.oppHit ? `ВЛУЧАННЯ (-${currentPassLog.oppDamage} HP)` : 'ЗАХИЩЕНО'}
                                            </span>
                                        </div>
                                        <div className="font-mono text-[10px] text-stone-300 bg-[#17100a] p-1.5 rounded leading-relaxed">
                                            Атака суперника: 1d20[{currentPassLog.oppD20Attack}] + {currentPassLog.oppStatsAvg} ((спритн.+сила)/2) + {currentPassLog.oppHorsemanshipSkillAttack} (їзда) {currentPassLog.oppAimHitMod >= 0 ? `+ ${currentPassLog.oppAimHitMod}` : `- ${Math.abs(currentPassLog.oppAimHitMod)}`} = <strong className="text-amber-300">{currentPassLog.oppAttackTotal}</strong><br/>
                                            Ваш захист: 1d20[{currentPassLog.playerD20Defense}] + {currentPassLog.playerDefenseStatsAvg} ((спритн.+мод.броні)/2) + {currentPassLog.playerHorsemanshipSkillDefense} (їзда) [Броня: +{currentPassLog.playerArmorModifier}] = <strong className="text-emerald-300">{currentPassLog.playerDefenseTotal}</strong><br/>
                                            Умова: {currentPassLog.oppAttackTotal} &gt; {currentPassLog.playerDefenseTotal} → <strong className={currentPassLog.oppHit ? 'text-rose-400' : 'text-emerald-400'}>{currentPassLog.oppHit ? 'ВЛУЧАННЯ' : 'ЗАХИЩЕНО'}</strong>
                                            {currentPassLog.oppHit && (
                                                <div className="text-rose-300 font-sans mt-0.5 text-[10px]">
                                                    💥 Завдано суперником: {oppStrength} + 8 + {currentPassLog.oppAimDamageMod} (приціл) = <strong>{currentPassLog.oppDamage} HP</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-stone-300 italic pt-0.5">
                                        {currentPassLog.comment}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-stone-500 text-xs text-center p-4">
                                    <span>Очікування команди на галоп... Натисніть «Спрямувати коня в атаку».</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Match End Overlay */}
                    {phase === 'match_end' && (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`p-5 rounded-2xl border-2 flex flex-col items-center text-center gap-3 shadow-2xl ${
                                gameResult === 'victory'
                                    ? 'bg-gradient-to-b from-[#1c301c] to-[#0f1d0f] border-emerald-400/80 text-emerald-100'
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
                                    {gameResult === 'victory' && (unhorsedStatus === 'opp' ? '👑 СУПЕРНИКА ЗБИТО З КОНЯ! БЛИСКУЧА ПЕРЕМОГА!' : '🏆 ПЕРЕМОГА В ЛИЦАРСЬКОМУ ДЖОСТИНГУ!')}
                                    {gameResult === 'defeat' && (unhorsedStatus === 'player' ? '💀 ВАС ЗБИТО З КОНЯ! ПОРАЗКА!' : '💀 ПОРАЗКА ЗА ОЧКАМИ ШКОДИ!')}
                                    {gameResult === 'draw' && '⚖️ РІВНИЙ ДВОБІЙ! НІЧИЯ!'}
                                </h3>
                                <div className="text-sm font-semibold mt-1">
                                    Завдано шкоди: <strong className="text-emerald-300 text-lg">{playerTotalDamageDealt}</strong> проти <strong className="text-amber-300 text-lg">{oppTotalDamageDealt}</strong>
                                </div>
                            </div>

                            {gameResult === 'victory' && (
                                <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/40 text-xs w-full text-emerald-200">
                                    <div className="font-bold text-amber-300 mb-1">Лицарські трофеї турніру:</div>
                                    <div className="flex justify-around font-bold">
                                        <span>🪙 +{opponent.rewards?.gold || 150} золота</span>
                                        <span>⭐ +{opponent.rewards?.xp || 200} XP</span>
                                        <span>👑 +{opponent.rewards?.reputation || 35} слави</span>
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
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-black font-black text-sm shadow-lg transition"
                                    >
                                        ПРИЙНЯТИ СЛАВУ ТА ЗАБРАТИ НАГОРОДУ
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (gameResult === 'defeat') onDefeat();
                                            onClose();
                                        }}
                                        className="flex-1 py-3 rounded-xl bg-[#2e1a14] hover:bg-[#3d231b] border border-stone-600 text-stone-200 font-bold text-sm transition"
                                    >
                                        ПОВЕРНУТИСЯ ДО ТАВЕРНИ
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={resetJoust}
                                    className="px-4 py-3 rounded-xl bg-[#251a12] hover:bg-[#38271b] border border-amber-500/50 text-amber-300 font-bold text-sm flex items-center gap-1.5 transition"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Реванш</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

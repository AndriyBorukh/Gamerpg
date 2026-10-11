import React, { useState, useEffect } from 'react';
import { OpponentData } from '../types';
import { FEMALE_MAGE_SPRITE, getCompanionSprite, isCharacterFemale } from '../lib/companionSprites';
import { X, Sparkles, Shield, Zap, Flame, Crown, RefreshCw, Trophy, Skull } from 'lucide-react';

export interface WizardSpell {
    id: string;
    type: 'attack' | 'defense';
    name: string;
    value: number; // damage or absorb
    icon: string;
    color: string;
    description: string;
}

export const INITIAL_ATTACK_SPELLS: Omit<WizardSpell, 'id'>[] = [
    { type: 'attack', name: 'Слабке закляття', value: 1, icon: '✨', color: 'from-amber-600 to-yellow-500', description: 'Завдає 1 пошкодження' },
    { type: 'attack', name: 'Слабке закляття', value: 1, icon: '✨', color: 'from-amber-600 to-yellow-500', description: 'Завдає 1 пошкодження' },
    { type: 'attack', name: 'Слабке закляття', value: 1, icon: '✨', color: 'from-amber-600 to-yellow-500', description: 'Завдає 1 пошкодження' },
    { type: 'attack', name: 'Середнє закляття', value: 2, icon: '⚡', color: 'from-orange-600 to-amber-500', description: 'Завдає 2 пошкодження' },
    { type: 'attack', name: 'Сильне закляття', value: 3, icon: '🔥', color: 'from-red-600 to-rose-500', description: 'Завдає 3 пошкодження' },
];

export const INITIAL_DEFENSE_SPELLS: Omit<WizardSpell, 'id'>[] = [
    { type: 'defense', name: 'Слабкий захист', value: 1, icon: '🛡️', color: 'from-blue-600 to-cyan-500', description: 'Забирає до 1 пошкодження' },
    { type: 'defense', name: 'Слабкий захист', value: 1, icon: '🛡️', color: 'from-blue-600 to-cyan-500', description: 'Забирає до 1 пошкодження' },
    { type: 'defense', name: 'Слабкий захист', value: 1, icon: '🛡️', color: 'from-blue-600 to-cyan-500', description: 'Забирає до 1 пошкодження' },
    { type: 'defense', name: 'Середній захист', value: 2, icon: '🔮', color: 'from-indigo-600 to-blue-500', description: 'Забирає до 2 пошкоджень' },
    { type: 'defense', name: 'Сильний захист', value: 3, icon: '🌌', color: 'from-purple-600 to-indigo-500', description: 'Забирає до 3 пошкоджень' },
];

export const INNATE_DEFENSE_DODGE: WizardSpell = {
    id: 'innate_def_dodge',
    type: 'defense',
    name: "Магічне ухилення (50%)",
    value: 0,
    icon: '💨',
    color: 'from-teal-600 to-emerald-500',
    description: "Шанс 50% повністю ухилитися від ворожого удару (0 шкоди). Не втрачає сили від ударів!"
};

export const getInnateBarrierSpell = (chance: number): WizardSpell => ({
    id: 'innate_def_barrier',
    type: 'defense',
    name: `Вроджений бар'єр (${chance}%)`,
    value: chance,
    icon: '🛡️✨',
    color: chance >= 75 ? 'from-cyan-600 to-blue-500' : chance >= 35 ? 'from-amber-600 to-orange-500' : 'from-rose-600 to-red-500',
    description: chance > 0
        ? `Рятує від атаки у ${chance}% випадків. Кожне попадання зменшує міцність на 20%!`
        : `Бар'єр повністю розбито (0%). Оберіть магічне ухилення 50%!`
});

export const INNATE_ATTACK_SPARK: WizardSpell = {
    id: 'innate_atk_spark',
    type: 'attack',
    name: "Вроджена іскра",
    value: 1,
    icon: '✨⚡',
    color: 'from-amber-600 to-yellow-500',
    description: "Базовий магічний випад (1 шкоди), коли атакуючі свитки вичерпано!"
};

interface WizardBattleModalProps {
    isOpen: boolean;
    opponent: { name: string; avatar?: string } | OpponentData;
    isTournament?: boolean;
    initialHp?: number;
    initialPlayerHp?: number;
    initialOppHp?: number;
    initialIsPlayerAttacking?: boolean;
    onVictory?: (finalPlayerHp?: number, finalOppHp?: number) => void;
    onDefeat?: (finalPlayerHp?: number, finalOppHp?: number) => void;
    onClose: () => void;
}

export function WizardBattleModal({
    isOpen,
    opponent,
    isTournament = false,
    initialHp = 3,
    initialPlayerHp,
    initialOppHp,
    initialIsPlayerAttacking,
    onVictory,
    onDefeat,
    onClose
}: WizardBattleModalProps) {
    // Single Battle State
    const [playerHp, setPlayerHp] = useState<number>(initialPlayerHp ?? initialHp);
    const [oppHp, setOppHp] = useState<number>(initialOppHp ?? initialHp);

    const [playerAttacks, setPlayerAttacks] = useState<WizardSpell[]>([]);
    const [playerDefenses, setPlayerDefenses] = useState<WizardSpell[]>([]);
    const [oppAttacks, setOppAttacks] = useState<WizardSpell[]>([]);
    const [oppDefenses, setOppDefenses] = useState<WizardSpell[]>([]);

    // Innate Barrier Chances (start at 95%, reduce by 20% per hit: 95 -> 75 -> 55 -> 35 -> 15 -> 0)
    const [playerBarrierChance, setPlayerBarrierChance] = useState<number>(95);
    const [oppBarrierChance, setOppBarrierChance] = useState<number>(95);

    const [isPlayerAttacking, setIsPlayerAttacking] = useState<boolean>(true); // true = player attacks, opp defends
    const [selectedSpell, setSelectedSpell] = useState<WizardSpell | null>(null);

    const [isRevealing, setIsRevealing] = useState<boolean>(false);
    const [lastResolution, setLastResolution] = useState<{
        attackerName: string;
        defenderName: string;
        attackSpell: WizardSpell;
        defenseSpell: WizardSpell;
        damageTaken: number;
    } | null>(null);

    const [battleLogs, setBattleLogs] = useState<string[]>([]);
    const [gameOver, setGameOver] = useState<'victory' | 'defeat' | 'draw' | null>(null);

    // Tournament State (16 Wizards)
    const [tournamentRound, setTournamentRound] = useState<number>(1); // 1 = 1/8, 2 = 1/4, 3 = Semi, 4 = Final
    const [tournamentWizards, setTournamentWizards] = useState<{ name: string; avatar: string; isPlayer?: boolean; isEliminated?: boolean }[]>([]);
    const [currentOpponentIndex, setCurrentOpponentIndex] = useState<number>(0);

    // Initialize Tournament
    useEffect(() => {
        if (!isOpen) return;

        if (isTournament) {
            const aiNames = [
                { name: 'Алхімік Вальдемар', avatar: '🧙‍♂️' },
                { name: 'Архімаг Ігнатіус', avatar: '🧙' },
                { name: 'Некромант Мордехай', avatar: '🧙‍♂️' },
                { name: 'Чародійка Селена', avatar: '🧙‍♀️' },
                { name: 'Піромант Грімм', avatar: '🔥' },
                { name: 'Кріомант Фрост', avatar: '❄️' },
                { name: 'Друїд Берендій', avatar: '🌿' },
                { name: 'Сферник Ельдар', avatar: '🔮' },
                { name: 'Ілюзіоніст Мерлін', avatar: '✨' },
                { name: 'Астромант Люціус', avatar: '🌟' },
                { name: 'Заклинатель рун Ульф', avatar: '⚡' },
                { name: 'Тіньовий маг Вейн', avatar: '🌑' },
                { name: 'Верховний чаклун Ольгерд', avatar: '👑' },
                { name: 'Маг хаосу Бальтазар', avatar: '🌀' },
                { name: 'Чародійка Феліція', avatar: '🧝‍♀️' },
            ];

            const list = [
                { name: 'Ви (Гравчиня/Гравець)', avatar: '🧙‍♂️', isPlayer: true, isEliminated: false },
                ...aiNames.map(a => ({ ...a, isEliminated: false }))
            ];
            setTournamentWizards(list);
            setTournamentRound(1);
            setupBattle(initialHp, list[1], initialIsPlayerAttacking, initialPlayerHp, initialOppHp);
        } else {
            setupBattle(initialHp, opponent, initialIsPlayerAttacking, initialPlayerHp, initialOppHp);
        }
    }, [isOpen, isTournament, initialIsPlayerAttacking, initialPlayerHp, initialOppHp]);

    const setupBattle = (
        hp: number, 
        targetOpponent: { name: string; avatar?: string }, 
        startingIsPlayerAtk?: boolean,
        startPHp?: number,
        startOHp?: number
    ) => {
        setPlayerHp(startPHp !== undefined ? startPHp : (initialPlayerHp !== undefined ? initialPlayerHp : hp));
        setOppHp(startOHp !== undefined ? startOHp : (initialOppHp !== undefined ? initialOppHp : hp));

        const createDeck = (templates: Omit<WizardSpell, 'id'>[], prefix: string) =>
            templates.map((t, idx) => ({ ...t, id: `${prefix}_${idx}_${Date.now()}_${Math.random()}` }));

        setPlayerAttacks(createDeck(INITIAL_ATTACK_SPELLS, 'p_atk'));
        setPlayerDefenses(createDeck(INITIAL_DEFENSE_SPELLS, 'p_def'));
        setOppAttacks(createDeck(INITIAL_ATTACK_SPELLS, 'o_atk'));
        setOppDefenses(createDeck(INITIAL_DEFENSE_SPELLS, 'o_def'));

        // Reset Innate Barriers to 95%
        setPlayerBarrierChance(95);
        setOppBarrierChance(95);

        const isAtk = typeof startingIsPlayerAtk === 'boolean'
            ? startingIsPlayerAtk
            : (typeof initialIsPlayerAttacking === 'boolean' ? initialIsPlayerAttacking : Math.random() > 0.5);

        setIsPlayerAttacking(isAtk);
        setSelectedSpell(null);
        setIsRevealing(false);
        setLastResolution(null);

        const startMsg = isAtk
            ? `⚔️ Ви нападаєте першим! Оберіть атакуюче закляття.`
            : `🛡️ ${targetOpponent?.name || 'Супротивник'} нападає! Оберіть захисне закляття проти його удару.`;

        setBattleLogs([`🔮 Чаклунський двобій розпочато проти ${targetOpponent?.name || 'Супротивника'}!`, startMsg]);
        setGameOver(null);
    };

    const currentOpponentInfo = isTournament && tournamentWizards.length > 0
        ? { name: tournamentWizards[currentOpponentIndex + 1]?.name || 'Маг', avatar: tournamentWizards[currentOpponentIndex + 1]?.avatar || '🧙‍♂️' }
        : { name: opponent?.name || 'Супротивник', avatar: opponent?.avatar || '🧙‍♂️' };

    // Player selects spell and confirms
    const handleConfirmSpellChoice = () => {
        if (!selectedSpell || isRevealing || gameOver) return;

        setIsRevealing(true);

        if (isPlayerAttacking) {
            // Player attacks, Opponent defends
            const pAtk = selectedSpell;

            // Pick AI defense spell (or innate fallback if AI ran out of defense spells)
            let oDef: WizardSpell;
            if (oppDefenses.length > 0) {
                const oppDefIndex = Math.floor(Math.random() * oppDefenses.length);
                oDef = oppDefenses[oppDefIndex];
            } else {
                // If AI barrier still has > 50% chance, prefer barrier (70%), else prefer dodge (75%)
                if (oppBarrierChance > 50) {
                    oDef = Math.random() < 0.7 ? getInnateBarrierSpell(oppBarrierChance) : INNATE_DEFENSE_DODGE;
                } else if (oppBarrierChance > 0) {
                    oDef = Math.random() < 0.75 ? INNATE_DEFENSE_DODGE : getInnateBarrierSpell(oppBarrierChance);
                } else {
                    oDef = INNATE_DEFENSE_DODGE;
                }
            }

            let dmg = 0;
            let displayDefSpell: WizardSpell = oDef;
            let defMsg = '';

            if (oDef.id === INNATE_DEFENSE_DODGE.id) {
                const dodgeSuccess = Math.random() < 0.5; // 50% chance to dodge completely
                dmg = dodgeSuccess ? 0 : pAtk.value;
                displayDefSpell = {
                    ...oDef,
                    name: 'Магічне ухилення (50%)',
                    description: dodgeSuccess ? 'Вдале ухилення (50%)! 0 шкоди!' : 'Ухилення не вдалося (50%)! Повна шкода!'
                };
                defMsg = dodgeSuccess
                    ? `[💨 Магічне ухилення (50%): УСПІХ! 0 шкоди]`
                    : `[💨 Магічне ухилення (50%): НЕВДАЧА! Пропущено ${dmg} шкоди]`;
            } else if (oDef.id === 'innate_def_barrier') {
                const chance = oppBarrierChance;
                const barrierSaved = Math.random() * 100 < chance; // рятує у 95% (або поточний chance)
                dmg = barrierSaved ? 0 : pAtk.value;
                const newOppBarrier = Math.max(0, chance - 20); // з кожним попаданням зменшується на 20
                setOppBarrierChance(newOppBarrier);

                displayDefSpell = {
                    ...oDef,
                    name: `Вроджений бар'єр (${chance}%)`,
                    description: barrierSaved
                        ? `Бар'єр врятував (шанс ${chance}%)! Міцність -20% (залишилось ${newOppBarrier}%)`
                        : `Бар'єр пробито (шанс ${chance}%)! Міцність -20% (залишилось ${newOppBarrier}%)`
                };
                defMsg = barrierSaved
                    ? `[🛡️ Вроджений бар'єр (${chance}%): ВРЯТУВАВ! 0 шкоди. Міцність бар'єру впала на 20% (тепер ${newOppBarrier}%)]`
                    : `[💥 Вроджений бар'єр (${chance}%): ПРОБИТО! Пропущено ${dmg} шкоди. Міцність бар'єру впала на 20% (тепер ${newOppBarrier}%)]`;
            } else {
                dmg = Math.max(0, pAtk.value - oDef.value);
                defMsg = `[${oDef.name} (-${oDef.value} DEF)]`;
            }

            const newOppHp = Math.max(0, oppHp - dmg);

            setLastResolution({
                attackerName: 'Ви',
                defenderName: currentOpponentInfo.name,
                attackSpell: pAtk,
                defenseSpell: displayDefSpell,
                damageTaken: dmg
            });

            setTimeout(() => {
                setOppHp(newOppHp);
                if (pAtk.id !== INNATE_ATTACK_SPARK.id) {
                    setPlayerAttacks(prev => prev.filter(s => s.id !== pAtk.id));
                }
                if (oDef.id !== 'innate_def_barrier' && oDef.id !== INNATE_DEFENSE_DODGE.id) {
                    setOppDefenses(prev => prev.filter(s => s.id !== oDef.id));
                }

                const logMsg = `⚔️ Ваша атака: [${pAtk.name} (${pAtk.value} ATK)] vs Захист ${currentOpponentInfo.name}: ${defMsg} => Наслідок: ${dmg > 0 ? `-${dmg} HP!` : 'Атака повністю нейтралізована!'}`;
                setBattleLogs(prev => [logMsg, ...prev]);

                const nextPAtk = pAtk.id !== INNATE_ATTACK_SPARK.id ? playerAttacks.length - 1 : playerAttacks.length;
                const nextODef = oDef.id !== 'innate_def_barrier' && oDef.id !== INNATE_DEFENSE_DODGE.id ? oppDefenses.length - 1 : oppDefenses.length;

                if (!checkBattleOver(playerHp, newOppHp, nextPAtk, playerDefenses.length, oppAttacks.length, nextODef)) {
                    setIsPlayerAttacking(false);
                }

                setSelectedSpell(null);
                setIsRevealing(false);
            }, 800);

        } else {
            // Player defends, Opponent attacks
            const pDef = selectedSpell;

            // Pick AI attack spell (or innate fallback if AI ran out of attacks)
            let oAtk: WizardSpell;
            if (oppAttacks.length > 0) {
                const oppAtkIndex = Math.floor(Math.random() * oppAttacks.length);
                oAtk = oppAttacks[oppAtkIndex];
            } else {
                oAtk = INNATE_ATTACK_SPARK;
            }

            let dmg = 0;
            let displayDefSpell: WizardSpell = pDef;
            let defMsg = '';

            if (pDef.id === INNATE_DEFENSE_DODGE.id) {
                const dodgeSuccess = Math.random() < 0.5; // 50% chance to dodge completely
                dmg = dodgeSuccess ? 0 : oAtk.value;
                displayDefSpell = {
                    ...pDef,
                    name: 'Магічне ухилення (50%)',
                    description: dodgeSuccess ? 'Вдале ухилення (50%)! 0 шкоди!' : 'Ухилення не вдалося (50%)! Повна шкода!'
                };
                defMsg = dodgeSuccess
                    ? `[💨 Магічне ухилення (50%): УСПІХ! Ви ухилилися від удару]`
                    : `[💨 Магічне ухилення (50%): НЕВДАЧА! Отримано ${dmg} шкоди]`;
            } else if (pDef.id === 'innate_def_barrier') {
                const chance = playerBarrierChance;
                const barrierSaved = Math.random() * 100 < chance; // рятує у 95% (або поточний chance)
                dmg = barrierSaved ? 0 : oAtk.value;
                const newPlayerBarrier = Math.max(0, chance - 20); // з кожним попаданням зменшується на 20
                setPlayerBarrierChance(newPlayerBarrier);

                displayDefSpell = {
                    ...pDef,
                    name: `Вроджений бар'єр (${chance}%)`,
                    description: barrierSaved
                        ? `Бар'єр врятував (шанс ${chance}%)! Міцність -20% (залишилось ${newPlayerBarrier}%)`
                        : `Бар'єр пробито (шанс ${chance}%)! Міцність -20% (залишилось ${newPlayerBarrier}%)`
                };
                defMsg = barrierSaved
                    ? `[🛡️ Вроджений бар'єр (${chance}%): ВРЯТУВАВ! 0 шкоди. Міцність впала на 20% (тепер ${newPlayerBarrier}%)]`
                    : `[💥 Вроджений бар'єр (${chance}%): ПРОБИТО! Отримано ${dmg} шкоди. Міцність впала на 20% (тепер ${newPlayerBarrier}%)]`;
            } else {
                dmg = Math.max(0, oAtk.value - pDef.value);
                defMsg = `[${pDef.name} (-${pDef.value} DEF)]`;
            }

            const newPlayerHp = Math.max(0, playerHp - dmg);

            setLastResolution({
                attackerName: currentOpponentInfo.name,
                defenderName: 'Ви',
                attackSpell: oAtk,
                defenseSpell: displayDefSpell,
                damageTaken: dmg
            });

            setTimeout(() => {
                setPlayerHp(newPlayerHp);
                if (oAtk.id !== INNATE_ATTACK_SPARK.id) {
                    setOppAttacks(prev => prev.filter(s => s.id !== oAtk.id));
                }
                if (pDef.id !== 'innate_def_barrier' && pDef.id !== INNATE_DEFENSE_DODGE.id) {
                    setPlayerDefenses(prev => prev.filter(s => s.id !== pDef.id));
                }

                const logMsg = `🛡️ Атака ${currentOpponentInfo.name}: [${oAtk.name} (${oAtk.value} ATK)] vs Ваш Захист: ${defMsg} => Наслідок: ${dmg > 0 ? `-${dmg} HP!` : 'Удар повністю поглинуто!'}`;
                setBattleLogs(prev => [logMsg, ...prev]);

                const nextPDef = pDef.id !== 'innate_def_barrier' && pDef.id !== INNATE_DEFENSE_DODGE.id ? playerDefenses.length - 1 : playerDefenses.length;
                const nextOAtk = oAtk.id !== INNATE_ATTACK_SPARK.id ? oppAttacks.length - 1 : oppAttacks.length;

                if (!checkBattleOver(newPlayerHp, oppHp, playerAttacks.length, nextPDef, nextOAtk, oppDefenses.length)) {
                    setIsPlayerAttacking(true);
                }

                setSelectedSpell(null);
                setIsRevealing(false);
            }, 800);
        }
    };

    const checkBattleOver = (
        pHp: number,
        oHp: number,
        pAtkCount: number,
        pDefCount: number,
        oAtkCount: number,
        oDefCount: number
    ): boolean => {
        if (oHp <= 0) {
            handleMatchEnd('victory', pHp, oHp);
            return true;
        }
        if (pHp <= 0) {
            handleMatchEnd('defeat', pHp, oHp);
            return true;
        }

        return false;
    };

    const handleMatchEnd = (result: 'victory' | 'defeat' | 'draw', finalPHp?: number, finalOHp?: number) => {
        setGameOver(result);
        const pEnd = finalPHp !== undefined ? finalPHp : playerHp;
        const oEnd = finalOHp !== undefined ? finalOHp : oppHp;

        if (isTournament) {
            if (result === 'victory') {
                if (tournamentRound === 4) {
                    setBattleLogs(prev => [`🏆 ВІТАЄМО! Ви вибороли Кубок Архімага у турнірі 16 чаклунів!`, ...prev]);
                    if (onVictory) onVictory(pEnd, oEnd);
                } else {
                    setBattleLogs(prev => [`🎉 Перемога у ${getRoundName(tournamentRound)}! Перехід у наступний раунд!`, ...prev]);
                }
            } else {
                setBattleLogs(prev => [`💀 Ви вибули з турніру чаклунів у ${getRoundName(tournamentRound)}.`, ...prev]);
                if (onDefeat) onDefeat(pEnd, oEnd);
            }
        } else {
            if (result === 'victory') {
                setBattleLogs(prev => [`🏆 Тріумф! Ви здолали супротивника у бойовому чаклунстві!`, ...prev]);
                if (onVictory) onVictory(pEnd, oEnd);
            } else if (result === 'defeat') {
                setBattleLogs(prev => [`💀 Поразка. Ваші чари виявилися слабшими...`, ...prev]);
                if (onDefeat) onDefeat(pEnd, oEnd);
            } else {
                setBattleLogs(prev => [`⚖️ Нічия! Сили виявилися абсолютно рівними.`, ...prev]);
                if (onVictory) onVictory(pEnd, oEnd);
            }
        }
    };

    const advanceTournamentNextRound = () => {
        if (tournamentRound >= 4 || gameOver !== 'victory') return;
        const nextRound = tournamentRound + 1;
        setTournamentRound(nextRound);
        const nextOppIdx = currentOpponentIndex + Math.pow(2, tournamentRound - 1);
        setCurrentOpponentIndex(nextOppIdx);

        setupBattle(initialHp, {
            name: tournamentWizards[nextOppIdx + 1]?.name || 'Маг',
            avatar: tournamentWizards[nextOppIdx + 1]?.avatar || '🧙‍♂️'
        });
    };

    const getRoundName = (round: number) => {
        switch (round) {
            case 1: return '1/8 Фіналу';
            case 2: return '1/4 Фіналу';
            case 3: return 'Півфінал';
            case 4: return 'ГРАНД-ФІНАЛ';
            default: return `Раунд ${round}`;
        }
    };

    if (!isOpen) return null;

    const currentHand = isPlayerAttacking
        ? (playerAttacks.length > 0 ? playerAttacks : [INNATE_ATTACK_SPARK])
        : (playerDefenses.length > 0 ? playerDefenses : [getInnateBarrierSpell(playerBarrierChance), INNATE_DEFENSE_DODGE]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-4xl bg-stone-900 border-2 border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-950 via-stone-900 to-indigo-950 border-b border-purple-500/30">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-7 h-7 text-purple-400 animate-pulse" />
                        <div>
                            <h2 className="text-2xl font-black text-purple-200 tracking-wide font-serif">
                                {isTournament ? `🧙‍♂️ Турнір Чаклунів (16 Магів) — ${getRoundName(tournamentRound)}` : '🧙‍♂️ Бій Чаклунів'}
                            </h2>
                            <p className="text-xs text-purple-300/70">
                                {initialHp} HP • Атака (3х1, 1х2, 1х3 + Іскра) • Захист (3х1, 1х2, 1х3) • Захист без свитків: Ухилення 50% або Бар'єр 95% (-20% за попадання)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">

                    {/* Tournament Bracket Info if Tournament */}
                    {isTournament && (
                        <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs text-purple-200">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                <span>Прогрес Турніру: <strong className="text-amber-300">{getRoundName(tournamentRound)}</strong></span>
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(r => (
                                    <span key={r} className={`px-2 py-0.5 rounded text-[10px] font-bold ${r === tournamentRound ? 'bg-purple-600 text-white' : r < tournamentRound ? 'bg-green-900/60 text-green-300' : 'bg-stone-800 text-stone-500'}`}>
                                        {r === 1 ? '1/8' : r === 2 ? '1/4' : r === 3 ? '1/2' : 'Фінал'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Battle Arena Duel View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Player Card */}
                        <div className={`p-5 rounded-2xl border-2 transition-all ${isPlayerAttacking ? 'bg-amber-950/20 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-blue-950/20 border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.2)]'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-16 rounded-xl bg-purple-950/60 border border-purple-500/50 overflow-hidden shadow-inner flex items-center justify-center relative flex-shrink-0">
                                        <img 
                                            src={'/assets/images/card_wizard_art_1787956829955.jpg'}
                                            alt="Маг"
                                            className="w-full h-full object-cover object-top"
                                        />
                                        <span className="absolute bottom-0.5 right-0.5 text-xs">🧙‍♂️</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-amber-200">Ви (Маг-Геймер)</h3>
                                        <span className={`inline-block text-[11px] font-black uppercase px-2 py-0.5 rounded ${isPlayerAttacking ? 'bg-amber-500 text-stone-950' : 'bg-blue-600 text-white'}`}>
                                            {isPlayerAttacking ? '⚔️ АТАКУЄТЕ' : '🛡️ ЗАХИЩАЄТЕСЯ'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-stone-400 font-semibold">Здоров'я (HP)</div>
                                    <div className="flex gap-1 mt-1 justify-end">
                                        {Array.from({ length: initialHp }).map((_, idx) => (
                                            <span key={idx} className={`text-2xl transition-all ${idx < playerHp ? 'opacity-100 scale-100' : 'opacity-20 grayscale scale-90'}`}>
                                                ❤️
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Remaining Hand Count Indicators */}
                            <div className="grid grid-cols-2 gap-2 text-xs bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                                <div className="flex items-center justify-between text-amber-300">
                                    <span>⚔️ Атаки в наявності:</span>
                                    <strong className="text-sm font-black">
                                        {playerAttacks.length > 0 ? `${playerAttacks.length} шт` : "Іскра (∞)"}
                                    </strong>
                                </div>
                                <div className="flex items-center justify-between text-cyan-300">
                                    <span>🛡️ Захист в наявності:</span>
                                    <strong className="text-sm font-black">
                                        {playerDefenses.length > 0 ? `${playerDefenses.length} шт` : `Бар'єр ${playerBarrierChance}% / 💨50%`}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Opponent Card */}
                        <div className={`p-5 rounded-2xl border-2 transition-all ${!isPlayerAttacking ? 'bg-amber-950/20 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-blue-950/20 border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.2)]'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-16 rounded-xl bg-purple-950/60 border border-purple-500/50 overflow-hidden shadow-inner flex items-center justify-center relative flex-shrink-0">
                                        <img 
                                            src={getCompanionSprite({
                                                name: currentOpponentInfo.name,
                                                avatar: currentOpponentInfo.avatar,
                                                type: 'маги'
                                            })}
                                            alt={currentOpponentInfo.name}
                                            className="w-full h-full object-cover object-top"
                                        />
                                        <span className="absolute bottom-0.5 right-0.5 text-xs">{currentOpponentInfo.avatar}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h3 className="font-bold text-lg text-rose-200">{currentOpponentInfo.name}</h3>
                                            {isCharacterFemale({ name: currentOpponentInfo.name, avatar: currentOpponentInfo.avatar }) && (
                                                <span className="text-xs font-bold text-pink-400">♀️</span>
                                            )}
                                        </div>
                                        <span className={`inline-block text-[11px] font-black uppercase px-2 py-0.5 rounded ${!isPlayerAttacking ? 'bg-amber-500 text-stone-950' : 'bg-blue-600 text-white'}`}>
                                            {!isPlayerAttacking ? '⚔️ АТАКУЄ' : '🛡️ ЗАХИЩАЄТЬСЯ'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-stone-400 font-semibold">Здоров'я (HP)</div>
                                    <div className="flex gap-1 mt-1 justify-end">
                                        {Array.from({ length: initialHp }).map((_, idx) => (
                                            <span key={idx} className={`text-2xl transition-all ${idx < oppHp ? 'opacity-100 scale-100' : 'opacity-20 grayscale scale-90'}`}>
                                                ❤️
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Remaining Opponent Spells */}
                            <div className="grid grid-cols-2 gap-2 text-xs bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                                <div className="flex items-center justify-between text-amber-300">
                                    <span>⚔️ Атаки чаклуна:</span>
                                    <strong className="text-sm font-black">
                                        {oppAttacks.length > 0 ? `${oppAttacks.length} шт` : "Іскра (∞)"}
                                    </strong>
                                </div>
                                <div className="flex items-center justify-between text-cyan-300">
                                    <span>🛡️ Захист чаклуна:</span>
                                    <strong className="text-sm font-black">
                                        {oppDefenses.length > 0 ? `${oppDefenses.length} шт` : `Бар'єр ${oppBarrierChance}% / 💨50%`}
                                    </strong>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Spell Reveal Animation Box */}
                    {lastResolution && (
                        <div className="p-4 bg-stone-950 border border-purple-500/40 rounded-xl flex flex-col items-center justify-center gap-2 animate-fade-in text-center">
                            <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">Результат зіткнення заклять</div>
                            <div className="flex items-center gap-4 text-sm font-bold">
                                <span className="p-2 bg-amber-900/40 text-amber-300 border border-amber-500/40 rounded-lg">
                                    ⚔️ {lastResolution.attackerName}: {lastResolution.attackSpell.name} ({lastResolution.attackSpell.value})
                                </span>
                                <span className="text-stone-400">VS</span>
                                <span className="p-2 bg-blue-900/40 text-blue-300 border border-blue-500/40 rounded-lg">
                                    🛡️ {lastResolution.defenderName}: {lastResolution.defenseSpell.name}
                                </span>
                            </div>
                            <div className="text-base font-black text-rose-400 mt-1">
                                {lastResolution.damageTaken === 0
                                    ? '✨ Захист повністю поглинув / ухилився від удару (0 шкоди)!'
                                    : `💥 Наслідок: Пропущено ${lastResolution.damageTaken} пошкодження!`}
                            </div>
                        </div>
                    )}

                    {/* Current Player Selection Area */}
                    {!gameOver && (
                        <div className="p-5 bg-stone-950/80 border border-purple-500/30 rounded-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-sm text-purple-200 flex items-center gap-2">
                                    {isPlayerAttacking ? <Zap className="w-4 h-4 text-amber-400" /> : <Shield className="w-4 h-4 text-blue-400" />}
                                    Оберіть {isPlayerAttacking ? 'Атакуюче закляття' : 'Захисне закляття'}:
                                </h4>
                                <span className="text-xs text-stone-400">
                                    {!isPlayerAttacking && playerDefenses.length === 0
                                        ? `🛡️ Свитки вичерпано — оберіть: Магічне ухилення (50%) або Вроджений бар'єр (${playerBarrierChance}%, -20% за попадання)!`
                                        : isPlayerAttacking && playerAttacks.length === 0
                                        ? "⚡ Бойові свитки вичерпано — активуйте вроджену магічну іскру!"
                                        : "Супротивник робить свій вибір одночасно всліпу"}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {currentHand.map((spell) => {
                                    const isSelected = selectedSpell?.id === spell.id;
                                    const isInnate = spell.id.startsWith('innate_');
                                    const isDodge = spell.id === INNATE_DEFENSE_DODGE.id;
                                    const isBarrier = spell.id === 'innate_def_barrier';

                                    return (
                                        <button
                                            key={spell.id}
                                            onClick={() => setSelectedSpell(spell)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${isSelected ? 'border-purple-400 bg-purple-900/40 scale-105 shadow-lg ring-2 ring-purple-400/50' : isInnate ? 'border-cyan-500/50 bg-stone-900/90 hover:border-cyan-400 hover:bg-stone-800/90 shadow-[0_0_10px_rgba(6,182,212,0.15)]' : 'border-stone-800 bg-stone-900 hover:border-stone-700 hover:bg-stone-800/80'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-2xl">{spell.icon}</span>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-xs font-black px-2 py-0.5 rounded bg-gradient-to-r ${spell.color} text-white`}>
                                                        {spell.type === 'attack'
                                                            ? `+${spell.value} ATK`
                                                            : isDodge
                                                            ? `50% УХИЛ`
                                                            : isBarrier
                                                            ? `${playerBarrierChance}% БАР'ЄР`
                                                            : `-${spell.value} DEF`}
                                                    </span>
                                                    {isInnate && (
                                                        <span className="text-[9px] font-black uppercase px-1 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                                                            НЕВИЧЕРПНЕ
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-bold text-xs text-stone-200 leading-snug">{spell.name}</div>
                                                <div className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">{spell.description}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    disabled={!selectedSpell || isRevealing}
                                    onClick={handleConfirmSpellChoice}
                                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2 ${selectedSpell && !isRevealing ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer scale-100' : 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-50'}`}
                                >
                                    <Sparkles className="w-4 h-4" />
                                    {!isPlayerAttacking && playerDefenses.length === 0
                                        ? (selectedSpell?.id === INNATE_DEFENSE_DODGE.id ? "Спробувати ухилитися (50%)" : `Активувати бар'єр (${playerBarrierChance}%)`)
                                        : isPlayerAttacking && playerAttacks.length === 0
                                        ? "Спрямувати вроджену іскру"
                                        : "Кастувати закляття всліпу"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Game Over Screen */}
                    {gameOver && (
                        <div className="p-6 bg-stone-950 border-2 border-amber-500/50 rounded-2xl text-center space-y-4 animate-scale-up">
                            {gameOver === 'victory' ? (
                                <div className="space-y-2">
                                    <Crown className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
                                    <h3 className="text-2xl font-black text-amber-300">ПЕРЕМОГА У ЧАКЛУНСЬКОМУ ДВОБОЇ!</h3>
                                    <p className="text-sm text-stone-300">
                                        Ваші магічні чари повністю здолали захист {currentOpponentInfo.name}!
                                    </p>
                                </div>
                            ) : gameOver === 'defeat' ? (
                                <div className="space-y-2">
                                    <Skull className="w-12 h-12 text-rose-500 mx-auto" />
                                    <h3 className="text-2xl font-black text-rose-400">ПОРАЗКА</h3>
                                    <p className="text-sm text-stone-300">
                                        Ваше здоров'я вичерпано або магічна енергія розсіяна...
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <RefreshCw className="w-12 h-12 text-blue-400 mx-auto" />
                                    <h3 className="text-2xl font-black text-blue-300">НІЧИЯ</h3>
                                    <p className="text-sm text-stone-300">
                                        Абсолютний баланс магічних сил!
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-center gap-3 pt-2">
                                {isTournament && gameOver === 'victory' && tournamentRound < 4 ? (
                                    <button
                                        onClick={advanceTournamentNextRound}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black rounded-xl hover:from-amber-400 shadow-lg flex items-center gap-2"
                                    >
                                        <Trophy className="w-5 h-5" />
                                        Перейти до {getRoundName(tournamentRound + 1)}
                                    </button>
                                ) : (
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl transition-colors"
                                    >
                                        Завершити дуель
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Battle Logs */}
                    <div className="p-4 bg-stone-950/60 border border-stone-800 rounded-xl space-y-1 max-h-36 overflow-y-auto font-mono text-xs text-stone-300">
                        <div className="font-bold text-stone-400 mb-1 font-sans">📜 Журнал чаклунських подій:</div>
                        {battleLogs.map((log, idx) => (
                            <div key={idx} className="leading-relaxed border-b border-stone-900/60 pb-0.5">
                                {log}
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}

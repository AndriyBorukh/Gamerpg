import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OpponentData } from '../types';
import { Character, Enemy, Spell, CombatItem, CombatCommandType } from '../lib/jrpgTypes';
import { calculatePhysicalDamage, calculateMagicDamage, calculateHealing, calculateInitiative } from '../lib/jrpgCombatEngine';
import { playSwordClashSound, playSparkleSound, playPunchSound, playGoldSound, playLevelUpSound } from '../lib/soundEffects';

interface FantasyAdventureModalProps {
    opponent: OpponentData;
    onClose: () => void;
    onComplete: (reward: number) => void;
}

// 8-bit Imp Sprite SVG
const PixelImpSprite = ({ isHit = false, isAttacking = false, isDead = false }: { isHit?: boolean; isAttacking?: boolean; isDead?: boolean }) => {
    if (isDead) return <div className="w-12 h-14 opacity-0 pointer-events-none" />;
    return (
        <div className={`relative w-12 h-14 transition-all duration-200 select-none ${
            isAttacking ? 'translate-x-6 scale-110 drop-shadow-[0_0_8px_#ff4400]' : ''
        } ${isHit ? 'brightness-200 -translate-x-1' : ''}`}>
            <svg viewBox="0 0 24 28" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" shapeRendering="crispEdges">
                {/* Horns */}
                <rect x="5" y="1" width="2" height="4" fill="#a83210" />
                <rect x="17" y="1" width="2" height="4" fill="#a83210" />
                <rect x="7" y="3" width="2" height="3" fill="#e06228" />
                <rect x="15" y="3" width="2" height="3" fill="#e06228" />
                {/* Head */}
                <rect x="8" y="5" width="8" height="7" fill="#d95822" />
                <rect x="9" y="6" width="6" height="5" fill="#f07c3e" />
                {/* Eyes */}
                <rect x="10" y="7" width="2" height="2" fill="#fff700" />
                <rect x="14" y="7" width="2" height="2" fill="#fff700" />
                <rect x="11" y="8" width="1" height="1" fill="#000" />
                <rect x="15" y="8" width="1" height="1" fill="#000" />
                {/* Mouth / fangs */}
                <rect x="11" y="10" width="3" height="1" fill="#4a0f02" />
                <rect x="11" y="9" width="1" height="1" fill="#ffffff" />
                <rect x="13" y="9" width="1" height="1" fill="#ffffff" />
                {/* Ears */}
                <rect x="6" y="6" width="2" height="3" fill="#a83210" />
                <rect x="16" y="6" width="2" height="3" fill="#a83210" />
                {/* Torso & arms */}
                <rect x="9" y="12" width="6" height="8" fill="#d95822" />
                <rect x="10" y="13" width="4" height="6" fill="#f59453" />
                {/* Claws */}
                <rect x="5" y="11" width="4" height="7" fill="#d95822" />
                <rect x="15" y="11" width="4" height="7" fill="#d95822" />
                <rect x="4" y="17" width="2" height="3" fill="#ffffff" />
                <rect x="18" y="17" width="2" height="3" fill="#ffffff" />
                {/* Loincloth / belts */}
                <rect x="9" y="18" width="6" height="3" fill="#7a3411" />
                <rect x="10" y="19" width="4" height="2" fill="#e6b422" />
                {/* Legs & feet */}
                <rect x="8" y="20" width="3" height="6" fill="#d95822" />
                <rect x="13" y="20" width="3" height="6" fill="#d95822" />
                <rect x="7" y="25" width="4" height="2" fill="#a83210" />
                <rect x="13" y="25" width="4" height="2" fill="#a83210" />
            </svg>
        </div>
    );
};

// 8-bit Hero Sprites
const PixelHeroSprite = ({ type, isAttacking = false, isHit = false, isDead = false }: { type: 'fighter' | 'thief' | 'white_mage' | 'black_mage'; isAttacking?: boolean; isHit?: boolean; isDead?: boolean }) => {
    if (isDead) {
        return (
            <div className="w-12 h-14 flex items-center justify-center opacity-60">
                <span className="text-2xl">🪦</span>
            </div>
        );
    }

    return (
        <div className={`relative w-12 h-14 transition-all duration-200 ${
            isAttacking ? '-translate-x-8 scale-110 drop-shadow-[0_0_8px_#ffffff]' : ''
        } ${isHit ? 'brightness-150 translate-x-2 bg-red-600/30 rounded' : ''}`}>
            {type === 'fighter' && (
                <svg viewBox="0 0 24 28" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" shapeRendering="crispEdges">
                    <rect x="8" y="2" width="7" height="4" fill="#a02010" />
                    <rect x="9" y="3" width="5" height="3" fill="#e03020" />
                    <rect x="9" y="6" width="5" height="4" fill="#fcd0a1" />
                    <rect x="12" y="7" width="1" height="1" fill="#000" />
                    <rect x="8" y="10" width="8" height="8" fill="#c02010" />
                    <rect x="9" y="11" width="6" height="6" fill="#f03828" />
                    <rect x="7" y="11" width="2" height="4" fill="#801008" />
                    <rect x="4" y="8" width="2" height="12" fill="#d0d8e8" />
                    <rect x="3" y="14" width="4" height="2" fill="#e8c040" />
                    <rect x="4" y="16" width="2" height="3" fill="#503020" />
                    <rect x="9" y="18" width="3" height="8" fill="#901008" />
                    <rect x="13" y="18" width="3" height="8" fill="#901008" />
                    <rect x="8" y="24" width="4" height="3" fill="#402010" />
                    <rect x="13" y="24" width="4" height="3" fill="#402010" />
                </svg>
            )}

            {type === 'thief' && (
                <svg viewBox="0 0 24 28" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" shapeRendering="crispEdges">
                    <rect x="8" y="2" width="7" height="4" fill="#50a0d0" />
                    <rect x="8" y="4" width="7" height="2" fill="#70c0f0" />
                    <rect x="9" y="6" width="5" height="4" fill="#fcd0a1" />
                    <rect x="12" y="7" width="1" height="1" fill="#000" />
                    <rect x="8" y="10" width="8" height="8" fill="#3080b0" />
                    <rect x="9" y="11" width="6" height="6" fill="#4aa0d8" />
                    <rect x="8" y="15" width="8" height="2" fill="#f0d040" />
                    <rect x="9" y="18" width="3" height="8" fill="#205080" />
                    <rect x="13" y="18" width="3" height="8" fill="#205080" />
                    <rect x="8" y="24" width="4" height="3" fill="#303030" />
                    <rect x="13" y="24" width="4" height="3" fill="#303030" />
                </svg>
            )}

            {type === 'white_mage' && (
                <svg viewBox="0 0 24 28" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" shapeRendering="crispEdges">
                    <rect x="8" y="2" width="8" height="8" fill="#ffffff" />
                    <rect x="7" y="3" width="2" height="7" fill="#e82020" />
                    <rect x="15" y="3" width="2" height="7" fill="#e82020" />
                    <rect x="10" y="5" width="4" height="4" fill="#fcd0a1" />
                    <rect x="12" y="6" width="1" height="1" fill="#000" />
                    <rect x="7" y="10" width="10" height="14" fill="#ffffff" />
                    <rect x="8" y="12" width="8" height="10" fill="#f4f4f4" />
                    <rect x="7" y="20" width="2" height="3" fill="#e82020" />
                    <rect x="11" y="20" width="2" height="3" fill="#e82020" />
                    <rect x="15" y="20" width="2" height="3" fill="#e82020" />
                    <rect x="4" y="6" width="2" height="20" fill="#b07040" />
                    <circle cx="5" cy="6" r="2" fill="#ffd040" />
                </svg>
            )}

            {type === 'black_mage' && (
                <svg viewBox="0 0 24 28" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" shapeRendering="crispEdges">
                    <polygon points="12,1 7,8 17,8" fill="#e0b820" />
                    <rect x="6" y="7" width="12" height="2" fill="#f8d830" />
                    <rect x="8" y="9" width="8" height="5" fill="#181820" />
                    <rect x="10" y="10" width="2" height="1" fill="#fff840" />
                    <rect x="14" y="10" width="2" height="1" fill="#fff840" />
                    <rect x="7" y="14" width="10" height="11" fill="#2040b0" />
                    <rect x="8" y="15" width="8" height="9" fill="#3060d8" />
                    <rect x="4" y="8" width="2" height="18" fill="#805030" />
                    <circle cx="5" cy="8" r="2" fill="#ff4020" />
                </svg>
            )}
        </div>
    );
};

export const FantasyAdventureModal = ({ opponent, onClose, onComplete }: FantasyAdventureModalProps) => {
    // 4 Heroes matching the screenshot: AAAA, BBBB, CCCC, KKKF
    const [party, setParty] = useState<Character[]>([
        {
            id: 'p1',
            name: 'AAAA',
            job: 'fighter',
            level: 1,
            stats: { hp: 30, maxHp: 30, mp: 0, maxMp: 0, str: 12, agi: 8, vit: 12, int: 3, mnd: 4, lck: 7 },
            isAlive: true,
            spriteType: 'fighter',
            spells: []
        },
        {
            id: 'p2',
            name: 'BBBB',
            job: 'thief',
            level: 1,
            stats: { hp: 33, maxHp: 33, mp: 0, maxMp: 0, str: 10, agi: 11, vit: 8, int: 4, mnd: 4, lck: 10 },
            isAlive: true,
            spriteType: 'thief',
            spells: []
        },
        {
            id: 'p3',
            name: 'CCCC',
            job: 'white_mage',
            level: 1,
            stats: { hp: 28, maxHp: 28, mp: 16, maxMp: 16, str: 4, agi: 6, vit: 6, int: 8, mnd: 14, lck: 6 },
            isAlive: true,
            spriteType: 'white_mage',
            spells: [
                { id: 'cure', name: 'CURE', mpCost: 4, type: 'heal', basePower: 25, targetScope: 'single_ally', description: 'Restores 25-35 HP to an ally' },
                { id: 'protect', name: 'PROT', mpCost: 5, type: 'buff', basePower: 8, targetScope: 'single_ally', description: 'Boosts DEF (+8)' },
                { id: 'holy', name: 'HOLY', mpCost: 12, type: 'damage', element: 'holy', basePower: 35, targetScope: 'single_enemy', description: 'Sacred blast on enemy' }
            ]
        },
        {
            id: 'p4',
            name: 'KKKF',
            job: 'black_mage',
            level: 1,
            stats: { hp: 28, maxHp: 28, mp: 20, maxMp: 20, str: 4, agi: 7, vit: 5, int: 15, mnd: 5, lck: 6 },
            isAlive: true,
            spriteType: 'black_mage',
            spells: [
                { id: 'fire', name: 'FIRE', mpCost: 5, type: 'damage', element: 'fire', basePower: 20, targetScope: 'single_enemy', description: 'Fire strike' },
                { id: 'lit', name: 'LIT', mpCost: 5, type: 'damage', element: 'lit', basePower: 22, targetScope: 'single_enemy', description: 'Lightning shock' },
                { id: 'ice', name: 'ICE', mpCost: 5, type: 'damage', element: 'ice', basePower: 20, targetScope: 'single_enemy', description: 'Ice bolt' },
                { id: 'firaga', name: 'FIR2', mpCost: 14, type: 'damage', element: 'fire', basePower: 30, targetScope: 'all_enemies', description: 'Flame wave on all' }
            ]
        }
    ]);

    // Inventory
    const [items, setItems] = useState<CombatItem[]>([
        { id: 'potion', name: 'POTION', count: 4, effect: 'heal_hp', power: 40, description: 'Heals 40 HP' },
        { id: 'hi_potion', name: 'HI-POT', count: 2, effect: 'heal_hp', power: 100, description: 'Heals 100 HP' },
        { id: 'ether', name: 'ETHER', count: 3, effect: 'heal_mp', power: 15, description: 'Restores 15 MP' },
        { id: 'phoenix', name: 'PHOEN', count: 1, effect: 'revive', power: 20, description: 'Revives fallen ally' }
    ]);

    // Enemies (5 Imps with balanced 38 HP so they don't get one-shot and fight fiercely!)
    const [enemies, setEnemies] = useState<Enemy[]>([
        { id: 'e1', name: 'IMP 1', hp: 36, maxHp: 36, stats: { hp: 36, maxHp: 36, mp: 0, maxMp: 0, str: 9, agi: 9, vit: 6, int: 3, mnd: 2, lck: 4 }, isAlive: true, spriteType: 'imp', xpReward: 16, goldReward: 24 },
        { id: 'e2', name: 'IMP 2', hp: 36, maxHp: 36, stats: { hp: 36, maxHp: 36, mp: 0, maxMp: 0, str: 9, agi: 8, vit: 6, int: 3, mnd: 2, lck: 4 }, isAlive: true, spriteType: 'imp', xpReward: 16, goldReward: 24 },
        { id: 'e3', name: 'IMP 3', hp: 36, maxHp: 36, stats: { hp: 36, maxHp: 36, mp: 0, maxMp: 0, str: 8, agi: 7, vit: 6, int: 3, mnd: 2, lck: 4 }, isAlive: true, spriteType: 'imp', xpReward: 16, goldReward: 24 },
        { id: 'e4', name: 'IMP 4', hp: 36, maxHp: 36, stats: { hp: 36, maxHp: 36, mp: 0, maxMp: 0, str: 8, agi: 8, vit: 6, int: 3, mnd: 2, lck: 4 }, isAlive: true, spriteType: 'imp', xpReward: 16, goldReward: 24 },
        { id: 'e5', name: 'IMP 5', hp: 36, maxHp: 36, stats: { hp: 36, maxHp: 36, mp: 0, maxMp: 0, str: 9, agi: 9, vit: 6, int: 3, mnd: 2, lck: 4 }, isAlive: true, spriteType: 'imp', xpReward: 16, goldReward: 24 }
    ]);

    // Combat State
    const [combatPhase, setCombatPhase] = useState<'command' | 'resolving' | 'victory' | 'defeat'>('command');
    const [activeHeroIdx, setActiveHeroIdx] = useState<number>(0);
    const [pendingCommands, setPendingCommands] = useState<{
        actorId: string;
        type: CombatCommandType;
        targetId: string;
        spell?: Spell;
        item?: CombatItem;
    }[]>([]);

    // Submenu state: 'main' | 'target_enemy' | 'target_ally' | 'magic' | 'item'
    const [menuView, setMenuView] = useState<'main' | 'target_enemy' | 'target_ally' | 'magic' | 'item'>('main');
    const [selectedCommand, setSelectedCommand] = useState<CombatCommandType>('fight');
    const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
    const [selectedItem, setSelectedItem] = useState<CombatItem | null>(null);

    // Selected cursor positions
    const [mainCursor, setMainCursor] = useState<'fight' | 'run' | 'magic' | 'drink' | 'item'>('fight');
    const [selectedEnemyTargetIdx, setSelectedEnemyTargetIdx] = useState<number>(0);

    // Combat Log lines (Box 1: Target info, Box 2: Action line, Box 3: Damage line)
    const [logTargetName, setLogTargetName] = useState<string>('IMP');
    const [logAction, setLogAction] = useState<string>('READY');
    const [logResult, setLogResult] = useState<string>('SELECT COMMAND');

    // Visual animation states
    const [attackingHeroId, setAttackingHeroId] = useState<string | null>(null);
    const [attackingEnemyId, setAttackingEnemyId] = useState<string | null>(null);
    const [hitEnemyId, setHitEnemyId] = useState<string | null>(null);
    const [hitHeroId, setHitHeroId] = useState<string | null>(null);
    const [floatingDamage, setFloatingDamage] = useState<{ id: string; text: string; isEnemy: boolean } | null>(null);

    const aliveEnemies = enemies.filter(e => e.isAlive);
    const aliveHeroes = party.filter(p => p.isAlive);

    // Ensure victory is captured whenever all enemies are defeated
    useEffect(() => {
        if (combatPhase !== 'victory' && combatPhase !== 'defeat') {
            const allEnemiesDead = enemies.length > 0 && enemies.every(e => !e.isAlive || e.hp <= 0);
            if (allEnemiesDead) {
                handleVictory();
            }
        }
    }, [enemies, combatPhase]);

    // Ensure defeat is captured if all heroes fall
    useEffect(() => {
        if (combatPhase !== 'victory' && combatPhase !== 'defeat') {
            const allPartyDead = party.length > 0 && party.every(p => !p.isAlive || p.stats.hp <= 0);
            if (allPartyDead) {
                handleDefeat();
            }
        }
    }, [party, combatPhase]);

    // Update log target name dynamically
    useEffect(() => {
        if (aliveEnemies[selectedEnemyTargetIdx]) {
            setLogTargetName(aliveEnemies[selectedEnemyTargetIdx].name);
        }
    }, [selectedEnemyTargetIdx, aliveEnemies]);

    // Handle selecting main menu option
    const handleSelectMainCommand = (cmd: 'fight' | 'run' | 'magic' | 'drink' | 'item') => {
        playPunchSound(false, false);
        const currentHero = party[activeHeroIdx];
        if (!currentHero || !currentHero.isAlive) return;

        if (cmd === 'fight') {
            setSelectedCommand('fight');
            setMenuView('target_enemy');
            setLogAction('SELECT TARGET');
            setLogResult('');
        } else if (cmd === 'magic') {
            if (currentHero.spells.length === 0) {
                setLogAction('NO MAGIC');
                setLogResult('CANNOT CAST');
                return;
            }
            setSelectedCommand('magic');
            setMenuView('magic');
            setLogAction('SELECT SPELL');
            setLogResult(`MP: ${currentHero.stats.mp}`);
        } else if (cmd === 'drink' || cmd === 'item') {
            setSelectedCommand(cmd);
            setMenuView('item');
            setLogAction('SELECT ITEM');
            setLogResult('');
        } else if (cmd === 'run') {
            playPunchSound(false, true);
            setLogTargetName('PARTY');
            setLogAction('FLEEING...');
            setLogResult('');
            setCombatPhase('resolving');

            setTimeout(() => {
                const escapeRoll = Math.random();
                if (escapeRoll > 0.4) {
                    setLogAction('ESCAPED SAFELY!');
                    setLogResult('FLED THE BATTLE');
                    setTimeout(() => {
                        onClose();
                    }, 1000);
                } else {
                    setLogAction('CANNOT ESCAPE!');
                    setLogResult('ENEMIES ATTACK!');
                    setTimeout(() => {
                        executeImmediateEnemyWave(enemies.filter(e => e.isAlive), party);
                    }, 800);
                }
            }, 700);
        }
    };

    // Confirm enemy target for attack/magic
    const confirmEnemyTarget = (enemyId: string) => {
        playSwordClashSound(false, false);
        const currentHero = party[activeHeroIdx];
        const newPending = [
            ...pendingCommands,
            {
                actorId: currentHero.id,
                type: selectedCommand,
                targetId: enemyId,
                spell: selectedSpell || undefined,
                item: selectedItem || undefined
            }
        ];
        setPendingCommands(newPending);
        setMenuView('main');
        setSelectedSpell(null);
        setSelectedItem(null);

        advanceToNextHeroOrExecute(newPending);
    };

    // Confirm ally target for heal / item
    const confirmAllyTarget = (allyId: string) => {
        playSparkleSound();
        const currentHero = party[activeHeroIdx];
        const newPending = [
            ...pendingCommands,
            {
                actorId: currentHero.id,
                type: selectedCommand,
                targetId: allyId,
                spell: selectedSpell || undefined,
                item: selectedItem || undefined
            }
        ];
        setPendingCommands(newPending);
        setMenuView('main');
        setSelectedSpell(null);
        setSelectedItem(null);

        advanceToNextHeroOrExecute(newPending);
    };

    // Move to next hero or launch interleaved turn execution
    const advanceToNextHeroOrExecute = (currentPending: typeof pendingCommands) => {
        let nextIdx = activeHeroIdx + 1;
        while (nextIdx < party.length && !party[nextIdx].isAlive) {
            nextIdx++;
        }

        if (nextIdx < party.length) {
            setActiveHeroIdx(nextIdx);
            setLogTargetName(party[nextIdx].name);
            setLogAction('READY');
            setLogResult(`HP ${party[nextIdx].stats.hp}`);
        } else {
            // All living heroes made their choices -> EXECUTE FULL TURN (HEROES + ENEMIES INTERLEAVED!)
            setCombatPhase('resolving');
            executeInterleavedRound(currentPending);
        }
    };

    // Quick auto-battle option (queues all living heroes immediately)
    const handleAutoBattleRound = () => {
        playSwordClashSound(false, false);
        const livingHeroList = party.filter(p => p.isAlive);
        const livingEnemyList = enemies.filter(e => e.isAlive);
        if (livingEnemyList.length === 0 || livingHeroList.length === 0) return;

        const autoCommands = livingHeroList.map((hero, idx) => ({
            actorId: hero.id,
            type: 'fight' as CombatCommandType,
            targetId: livingEnemyList[idx % livingEnemyList.length].id
        }));

        setPendingCommands(autoCommands);
        setCombatPhase('resolving');
        executeInterleavedRound(autoCommands);
    };

    // Undo previous hero command
    const handleCancelPreviousHero = () => {
        if (pendingCommands.length === 0) return;
        const newPending = [...pendingCommands];
        newPending.pop();
        setPendingCommands(newPending);

        let prevIdx = activeHeroIdx - 1;
        while (prevIdx >= 0 && !party[prevIdx].isAlive) {
            prevIdx--;
        }
        if (prevIdx >= 0) {
            setActiveHeroIdx(prevIdx);
            setMenuView('main');
        }
    };

    // FULL INTERLEAVED ROUND: Combines Heroes + Enemies into an initiative queue!
    // Enemies will attack during the round based on their speed!
    const executeInterleavedRound = async (heroActions: typeof pendingCommands) => {
        let currentParty = [...party];
        let currentEnemies = [...enemies];

        // 1. Build Combatants Queue with Initiative rolls (GDD Section 3.3)
        interface CombatantTurn {
            isEnemy: boolean;
            id: string;
            initiative: number;
            heroAction?: typeof heroActions[0];
        }

        const queue: CombatantTurn[] = [];

        // Add living heroes who have actions
        for (const act of heroActions) {
            const hero = currentParty.find(p => p.id === act.actorId && p.isAlive);
            if (hero) {
                queue.push({
                    isEnemy: false,
                    id: hero.id,
                    initiative: calculateInitiative(hero),
                    heroAction: act
                });
            }
        }

        // Add living enemies
        for (const enemy of currentEnemies) {
            if (enemy.isAlive) {
                queue.push({
                    isEnemy: true,
                    id: enemy.id,
                    initiative: calculateInitiative(enemy)
                });
            }
        }

        // Sort descending by initiative (Fastest acts first!)
        queue.sort((a, b) => b.initiative - a.initiative);

        setLogTargetName('BATTLE');
        setLogAction('ROUND INITIATED');
        setLogResult('CLASH!');
        await new Promise(r => setTimeout(r, 450));

        // 2. Process turn queue
        for (const turnItem of queue) {
            // Check victory / defeat conditions
            if (currentEnemies.every(e => !e.isAlive)) {
                handleVictory();
                return;
            }
            if (currentParty.every(p => !p.isAlive)) {
                handleDefeat();
                return;
            }

            if (!turnItem.isEnemy && turnItem.heroAction) {
                // --- HERO TURN ---
                const act = turnItem.heroAction;
                const hero = currentParty.find(p => p.id === act.actorId && p.isAlive);
                if (!hero) continue;

                setAttackingHeroId(hero.id);

                if (act.type === 'fight') {
                    let target = currentEnemies.find(e => e.id === act.targetId && e.isAlive) || currentEnemies.find(e => e.isAlive);
                    if (target) {
                        setLogTargetName(target.name);
                        setLogAction(`${hero.name} ATTACKS`);

                        const hitRes = calculatePhysicalDamage(hero, target);
                        playSwordClashSound(hitRes.isCrit, false);

                        setHitEnemyId(target.id);
                        setFloatingDamage({ id: target.id, text: hitRes.isHit ? `${hitRes.damage}` : 'MISS', isEnemy: true });

                        if (hitRes.isHit) {
                            target.hp = Math.max(0, target.hp - hitRes.damage);
                            target.isAlive = target.hp > 0;
                            setLogResult(hitRes.isCrit ? `${hitRes.damage} CRITICAL!` : `${hitRes.damage} DMG`);
                        } else {
                            setLogResult('MISSED!');
                        }

                        currentEnemies = [...currentEnemies];
                        setEnemies(currentEnemies);

                        // Check victory immediately after attack
                        if (currentEnemies.every(e => !e.isAlive || e.hp <= 0)) {
                            await new Promise(r => setTimeout(r, 400));
                            setAttackingHeroId(null);
                            setHitEnemyId(null);
                            setFloatingDamage(null);
                            handleVictory();
                            return;
                        }
                    }
                } else if (act.type === 'magic' && act.spell) {
                    const spell = act.spell;
                    hero.stats.mp = Math.max(0, hero.stats.mp - spell.mpCost);
                    currentParty = [...currentParty];
                    setParty(currentParty);

                    if (spell.type === 'heal') {
                        const targetAlly = currentParty.find(p => p.id === act.targetId) || hero;
                        const healVal = calculateHealing(hero, spell);
                        playSparkleSound();
                        targetAlly.stats.hp = Math.min(targetAlly.stats.maxHp, targetAlly.stats.hp + healVal);
                        targetAlly.isAlive = true;
                        setLogTargetName(targetAlly.name);
                        setLogAction(`${hero.name} CASTS ${spell.name}`);
                        setLogResult(`+${healVal} HP`);
                        setFloatingDamage({ id: targetAlly.id, text: `+${healVal}`, isEnemy: false });
                    } else if (spell.targetScope === 'all_enemies') {
                        playSparkleSound();
                        setLogTargetName('ALL ENEMIES');
                        setLogAction(`${hero.name} CASTS ${spell.name}`);
                        let totalDmg = 0;
                        currentEnemies.forEach(e => {
                            if (e.isAlive) {
                                const magRes = calculateMagicDamage(hero, spell);
                                e.hp = Math.max(0, e.hp - magRes.damage);
                                e.isAlive = e.hp > 0;
                                totalDmg += magRes.damage;
                            }
                        });
                        setLogResult(`${totalDmg} FLAME DMG`);
                        currentEnemies = [...currentEnemies];
                        setEnemies(currentEnemies);

                        // Check victory immediately after AoE spell
                        if (currentEnemies.every(e => !e.isAlive || e.hp <= 0)) {
                            await new Promise(r => setTimeout(r, 400));
                            setAttackingHeroId(null);
                            setHitEnemyId(null);
                            setFloatingDamage(null);
                            handleVictory();
                            return;
                        }
                    } else {
                        let target = currentEnemies.find(e => e.id === act.targetId && e.isAlive) || currentEnemies.find(e => e.isAlive);
                        if (target) {
                            const magRes = calculateMagicDamage(hero, spell);
                            playSparkleSound();
                            target.hp = Math.max(0, target.hp - magRes.damage);
                            target.isAlive = target.hp > 0;
                            setHitEnemyId(target.id);
                            setLogTargetName(target.name);
                            setLogAction(`${hero.name} CASTS ${spell.name}`);
                            setLogResult(`${magRes.damage} MAG DMG`);
                            setFloatingDamage({ id: target.id, text: `${magRes.damage}`, isEnemy: true });
                            currentEnemies = [...currentEnemies];
                            setEnemies(currentEnemies);

                            // Check victory immediately after spell
                            if (currentEnemies.every(e => !e.isAlive || e.hp <= 0)) {
                                await new Promise(r => setTimeout(r, 400));
                                setAttackingHeroId(null);
                                setHitEnemyId(null);
                                setFloatingDamage(null);
                                handleVictory();
                                return;
                            }
                        }
                    }
                } else if ((act.type === 'drink' || act.type === 'item') && act.item) {
                    const item = act.item;
                    const targetAlly = currentParty.find(p => p.id === act.targetId) || hero;
                    playSparkleSound();
                    if (item.effect === 'heal_hp') {
                        targetAlly.stats.hp = Math.min(targetAlly.stats.maxHp, targetAlly.stats.hp + item.power);
                    } else if (item.effect === 'heal_mp') {
                        targetAlly.stats.mp = Math.min(targetAlly.stats.maxMp, targetAlly.stats.mp + item.power);
                    } else if (item.effect === 'revive') {
                        targetAlly.stats.hp = Math.min(targetAlly.stats.maxHp, item.power);
                        targetAlly.isAlive = true;
                    }
                    setItems(prev => prev.map(i => i.id === item.id ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0));
                    setLogTargetName(targetAlly.name);
                    setLogAction(`USED ${item.name}`);
                    setLogResult('RESTORED');
                }

                await new Promise(r => setTimeout(r, 650));
                setAttackingHeroId(null);
                setHitEnemyId(null);
                setFloatingDamage(null);

            } else if (turnItem.isEnemy) {
                // --- ENEMY TURN (ACTIVE ENEMY ATTACKS HERO!) ---
                const enemy = currentEnemies.find(e => e.id === turnItem.id && e.isAlive);
                if (!enemy) continue;

                const aliveHeroTargets = currentParty.filter(p => p.isAlive);
                if (aliveHeroTargets.length === 0) {
                    handleDefeat();
                    return;
                }

                // Choose target hero (Fighter has slight aggro preference)
                const targetHero = aliveHeroTargets[Math.floor(Math.random() * aliveHeroTargets.length)];

                // Enemy lunges forward animation!
                setAttackingEnemyId(enemy.id);

                // Varied attacks: SLAM, CLAW, BITE
                const attackNames = ['SLAM', 'CLAW', 'BITE'];
                const chosenAttack = attackNames[Math.floor(Math.random() * attackNames.length)];

                setLogTargetName(enemy.name);
                setLogAction(chosenAttack);

                // Small pause for lunge
                await new Promise(r => setTimeout(r, 200));

                const hitRes = calculatePhysicalDamage(enemy, targetHero);
                playPunchSound(false, false);

                // Shake & hit the targeted hero!
                setHitHeroId(targetHero.id);

                if (hitRes.isHit) {
                    targetHero.stats.hp = Math.max(0, targetHero.stats.hp - hitRes.damage);
                    targetHero.isAlive = targetHero.stats.hp > 0;
                    setLogResult(`${hitRes.damage} DMG!`);
                    setFloatingDamage({ id: targetHero.id, text: `-${hitRes.damage}`, isEnemy: false });
                } else {
                    setLogResult('MISSED!');
                    setFloatingDamage({ id: targetHero.id, text: 'MISS', isEnemy: false });
                }

                currentParty = [...currentParty];
                setParty(currentParty);

                await new Promise(r => setTimeout(r, 650));
                setAttackingEnemyId(null);
                setHitHeroId(null);
                setFloatingDamage(null);
            }
        }

        // Round complete -> Return to command selection for living heroes
        if (currentEnemies.every(e => !e.isAlive || e.hp <= 0)) {
            handleVictory();
            return;
        }
        if (currentParty.every(p => !p.isAlive || p.stats.hp <= 0)) {
            handleDefeat();
            return;
        }

        setPendingCommands([]);
        let firstAlive = currentParty.findIndex(p => p.isAlive);
        if (firstAlive === -1) firstAlive = 0;
        setActiveHeroIdx(firstAlive);
        setMenuView('main');
        setCombatPhase('command');
        setLogTargetName(currentParty[firstAlive]?.name || '');
        setLogAction('COMMAND');
        setLogResult('SELECT ACTION');
    };

    // Enemy attack wave if player failed escape
    const executeImmediateEnemyWave = async (livingEnemies: Enemy[], currentParty: Character[]) => {
        for (const enemy of livingEnemies) {
            if (!enemy.isAlive) continue;
            const aliveHeroesList = currentParty.filter(p => p.isAlive);
            if (aliveHeroesList.length === 0) {
                handleDefeat();
                return;
            }

            const targetHero = aliveHeroesList[Math.floor(Math.random() * aliveHeroesList.length)];
            setAttackingEnemyId(enemy.id);
            setLogTargetName(enemy.name);
            setLogAction('SLAM');

            await new Promise(r => setTimeout(r, 200));

            const hitRes = calculatePhysicalDamage(enemy, targetHero);
            playPunchSound(false, false);

            setHitHeroId(targetHero.id);

            if (hitRes.isHit) {
                targetHero.stats.hp = Math.max(0, targetHero.stats.hp - hitRes.damage);
                targetHero.isAlive = targetHero.stats.hp > 0;
                setLogResult(`${hitRes.damage} DMG!`);
                setFloatingDamage({ id: targetHero.id, text: `-${hitRes.damage}`, isEnemy: false });
            } else {
                setLogResult('MISS!');
            }

            currentParty = [...currentParty];
            setParty(currentParty);

            await new Promise(r => setTimeout(r, 650));
            setAttackingEnemyId(null);
            setHitHeroId(null);
            setFloatingDamage(null);

            if (currentParty.every(p => !p.isAlive)) {
                handleDefeat();
                return;
            }
        }

        setCombatPhase('command');
        setLogTargetName(currentParty.find(p => p.isAlive)?.name || '');
        setLogAction('COMMAND');
        setLogResult('SELECT ACTION');
    };

    // Victory
    const handleVictory = () => {
        playLevelUpSound();
        playGoldSound();
        setCombatPhase('victory');
        setLogTargetName('VICTORY!');
        setLogAction('ALL ENEMIES SLAIN');
        setLogResult('+95 EXP  +150 GIL');
    };

    // Defeat
    const handleDefeat = () => {
        setCombatPhase('defeat');
        setLogTargetName('DEFEATED');
        setLogAction('PARTY WIPED OUT');
        setLogResult('BATTLE LOST');
    };

    const currentActiveHero = party[activeHeroIdx];

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-2 sm:p-4 z-50 select-none">
            {/* Retro 8-bit NES CRT Frame with double borders */}
            <div className="relative w-full max-w-[880px] aspect-[4/3] max-h-[94vh] bg-black border-[4px] border-white ring-2 ring-black rounded-sm flex flex-col overflow-hidden font-mono text-white shadow-2xl">
                
                {/* Top right exit button */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-50 bg-black/80 hover:bg-rose-900 border-2 border-white text-white font-black text-xs px-2 py-1 transition-all"
                    title="Вийти з битви до таверни"
                >
                    ✕ ВИЙТИ
                </button>

                {/* TOP HALF: BATTLEFIELD (Screen split between Forest scenery + enemies + party) */}
                <div className="relative h-[62%] w-full flex flex-col border-b-[4px] border-white bg-black overflow-hidden">
                    
                    {/* Top strip: Blue Sky with pixel clouds and green pine forest canopy */}
                    <div className="h-20 w-full relative border-b-2 border-white/40 overflow-hidden flex flex-col justify-end">
                        <div className="absolute inset-0 bg-[#2860d8] flex items-center justify-between px-4">
                            <div className="w-16 h-4 bg-white/90 rounded-sm" />
                            <div className="w-24 h-5 bg-white/90 rounded-sm" />
                            <div className="w-12 h-3 bg-white/90 rounded-sm" />
                        </div>
                        {/* Dense Green Pine Trees Backdrop */}
                        <div className="relative z-10 h-10 w-full flex items-end overflow-hidden opacity-95">
                            {Array.from({ length: 32 }).map((_, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] border-b-[#107028]" />
                                    <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[16px] border-b-[#0b541e] -mt-2" />
                                    <div className="w-1.5 h-2 bg-[#4a2e12]" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Arena Stage: Left (Enemies), Right (Heroes) with vertical divider border */}
                    <div className="flex-grow flex relative">
                        {/* Left Side: Enemy Battle Zone */}
                        <div className="w-1/2 h-full border-r-[4px] border-white p-4 flex items-center justify-center relative">
                            {/* Grid of 5 Imps in columns */}
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 items-center">
                                {enemies.map((enemy, idx) => {
                                    const isSelected = menuView === 'target_enemy' && aliveEnemies[selectedEnemyTargetIdx]?.id === enemy.id;
                                    const isAttacking = attackingEnemyId === enemy.id;
                                    const isHit = hitEnemyId === enemy.id;

                                    return (
                                        <div 
                                            key={enemy.id} 
                                            onClick={() => {
                                                if (combatPhase === 'command' && menuView === 'target_enemy' && enemy.isAlive) {
                                                    confirmEnemyTarget(enemy.id);
                                                }
                                            }}
                                            className={`relative flex items-center cursor-pointer p-1 rounded transition-all ${
                                                isSelected ? 'scale-110 drop-shadow-[0_0_8px_#ffd700]' : ''
                                            }`}
                                        >
                                            {/* Pointer indicator */}
                                            {isSelected && (
                                                <div className="absolute -left-6 z-20 text-white animate-pulse text-lg font-black">
                                                    👉
                                                </div>
                                            )}

                                            {/* Floating damage counter */}
                                            {floatingDamage && floatingDamage.id === enemy.id && (
                                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 font-black text-red-400 text-base bg-black/90 px-1 border border-red-500 animate-bounce">
                                                    {floatingDamage.text}
                                                </div>
                                            )}

                                            <PixelImpSprite 
                                                isHit={isHit} 
                                                isAttacking={isAttacking} 
                                                isDead={!enemy.isAlive} 
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Side: Hero Party Column (4 Heroes in vertical formation) */}
                        <div className="w-1/2 h-full p-4 flex flex-col justify-around items-end pr-10 relative">
                            {party.map((hero, idx) => {
                                const isActiveTurn = combatPhase === 'command' && activeHeroIdx === idx;
                                const isAttacking = attackingHeroId === hero.id;
                                const isHit = hitHeroId === hero.id;

                                return (
                                    <div 
                                        key={hero.id}
                                        onClick={() => {
                                            if (combatPhase === 'command' && menuView === 'target_ally') {
                                                confirmAllyTarget(hero.id);
                                            }
                                        }}
                                        className={`relative flex items-center transition-all ${
                                            isActiveTurn ? '-translate-x-4 drop-shadow-[0_0_6px_#ffffff]' : ''
                                        }`}
                                    >
                                        {/* Floating healing / damage counter */}
                                        {floatingDamage && floatingDamage.id === hero.id && (
                                            <div className={`absolute -top-3 -left-12 z-30 font-black text-sm px-1.5 py-0.5 border animate-bounce ${
                                                floatingDamage.text.startsWith('+') 
                                                    ? 'text-emerald-400 border-emerald-500 bg-black/90' 
                                                    : 'text-red-400 border-red-500 bg-black/90'
                                            }`}>
                                                {floatingDamage.text}
                                            </div>
                                        )}

                                        {menuView === 'target_ally' && (
                                            <span className="absolute -left-6 text-yellow-300 animate-pulse">👉</span>
                                        )}

                                        <PixelHeroSprite 
                                            type={hero.spriteType} 
                                            isAttacking={isAttacking} 
                                            isHit={isHit}
                                            isDead={!hero.isAlive} 
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* FULL SCREEN VICTORY OVERLAY OVER THE BATTLEFIELD */}
                    {combatPhase === 'victory' && (
                        <div className="absolute inset-0 bg-black/85 z-40 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                            <div className="border-[4px] border-yellow-400 bg-[#0e0e18] p-6 max-w-md w-full shadow-[0_0_25px_rgba(250,204,21,0.5)] flex flex-col items-center gap-3">
                                <div className="text-yellow-400 font-black text-2xl tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                                    ★ ВЕЛИЧНА ПЕРЕМОГА! ★
                                </div>
                                <div className="text-white text-sm font-bold tracking-wide">
                                    Усі вороги повалені у чесній битві!
                                </div>
                                <div className="flex gap-4 my-2 text-base font-black">
                                    <span className="text-emerald-400 bg-black/60 px-3 py-1 border border-emerald-500/50">
                                        +95 EXP
                                    </span>
                                    <span className="text-yellow-300 bg-black/60 px-3 py-1 border border-yellow-500/50">
                                        +150 GIL
                                    </span>
                                </div>
                                <button
                                    onClick={() => onComplete(150)}
                                    className="w-full mt-2 py-3 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-black font-black text-base uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all border-2 border-white cursor-pointer"
                                >
                                    🏆 ЗАВЕРШИТИ ТА ЗАБРАТИ НАГОРОДУ
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FULL SCREEN DEFEAT OVERLAY OVER THE BATTLEFIELD */}
                    {combatPhase === 'defeat' && (
                        <div className="absolute inset-0 bg-black/85 z-40 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                            <div className="border-[4px] border-rose-600 bg-[#180a0a] p-6 max-w-md w-full shadow-[0_0_25px_rgba(225,29,72,0.5)] flex flex-col items-center gap-3">
                                <div className="text-rose-500 font-black text-2xl tracking-widest">
                                    💀 ПОРАЗКА...
                                </div>
                                <div className="text-neutral-300 text-sm font-bold">
                                    Партія героїв пала у бою.
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full mt-2 py-3 bg-rose-700 text-white font-black text-base uppercase tracking-wider shadow-lg hover:bg-rose-600 active:scale-95 transition-all border-2 border-white cursor-pointer"
                                >
                                    ВІДСТУПИТИ ДО ТАВЕРНИ
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* BOTTOM HALF: NES COMMAND & STATUS WINDOWS */}
                <div className="h-[38%] w-full flex p-2 gap-2 bg-black">
                    
                    {/* BOTTOM BOX 1 (LEFT): TARGET / COMBAT LOG WINDOW (matching screenshot) */}
                    <div className="w-[30%] border-[3px] border-white bg-black p-3 flex flex-col justify-between text-sm sm:text-base leading-snug">
                        <div className="text-amber-400 font-bold uppercase tracking-wider border-b border-white/20 pb-1 truncate">
                            {logTargetName || '—'}
                        </div>
                        <div className="text-white font-bold tracking-wide truncate">
                            {logAction || ' '}
                        </div>
                        <div className="text-yellow-300 font-black tracking-wide truncate">
                            {logResult || ' '}
                        </div>
                    </div>

                    {/* BOTTOM BOX 2 (CENTER): COMMAND SELECTION MENU */}
                    <div className="w-[42%] border-[3px] border-white bg-black p-2 flex flex-col justify-between text-sm sm:text-base relative">
                        
                        {/* MAIN MENU */}
                        {menuView === 'main' && combatPhase === 'command' && (
                            <div className="flex flex-col justify-between h-full p-1">
                                <div className="text-[11px] text-yellow-400 font-bold mb-1 flex justify-between items-center">
                                    <span>HERO {activeHeroIdx + 1}/4: {currentActiveHero?.name}</span>
                                    <button 
                                        onClick={handleAutoBattleRound}
                                        className="bg-amber-600 hover:bg-amber-500 text-black px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                                        title="Quick Battle: All heroes attack and round executes with enemy retaliation!"
                                    >
                                        ⚡ ALL FIGHT
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 flex-grow items-center">
                                    {/* FIGHT */}
                                    <button 
                                        onClick={() => handleSelectMainCommand('fight')}
                                        onMouseEnter={() => setMainCursor('fight')}
                                        className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors text-left uppercase font-bold"
                                    >
                                        <span className={`w-4 ${mainCursor === 'fight' ? 'opacity-100' : 'opacity-0'}`}>👉</span>
                                        FIGHT
                                    </button>

                                    {/* RUN */}
                                    <button 
                                        onClick={() => handleSelectMainCommand('run')}
                                        onMouseEnter={() => setMainCursor('run')}
                                        className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors text-left uppercase font-bold"
                                    >
                                        <span className={`w-4 ${mainCursor === 'run' ? 'opacity-100' : 'opacity-0'}`}>👉</span>
                                        RUN
                                    </button>

                                    {/* MAGIC */}
                                    <button 
                                        onClick={() => handleSelectMainCommand('magic')}
                                        onMouseEnter={() => setMainCursor('magic')}
                                        className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors text-left uppercase font-bold"
                                    >
                                        <span className={`w-4 ${mainCursor === 'magic' ? 'opacity-100' : 'opacity-0'}`}>👉</span>
                                        MAGIC
                                    </button>

                                    {/* DRINK */}
                                    <button 
                                        onClick={() => handleSelectMainCommand('drink')}
                                        onMouseEnter={() => setMainCursor('drink')}
                                        className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors text-left uppercase font-bold"
                                    >
                                        <span className={`w-4 ${mainCursor === 'drink' ? 'opacity-100' : 'opacity-0'}`}>👉</span>
                                        DRINK
                                    </button>

                                    {/* ITEM */}
                                    <button 
                                        onClick={() => handleSelectMainCommand('item')}
                                        onMouseEnter={() => setMainCursor('item')}
                                        className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors text-left uppercase font-bold"
                                    >
                                        <span className={`w-4 ${mainCursor === 'item' ? 'opacity-100' : 'opacity-0'}`}>👉</span>
                                        ITEM
                                    </button>

                                    {/* Back button */}
                                    {pendingCommands.length > 0 && (
                                        <button 
                                            onClick={handleCancelPreviousHero}
                                            className="text-xs text-rose-400 hover:text-rose-200 underline text-left"
                                        >
                                            [BACK]
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TARGET ENEMY SUBMENU */}
                        {menuView === 'target_enemy' && (
                            <div className="flex flex-col h-full justify-between p-1">
                                <div className="text-xs text-yellow-300 mb-1">SELECT ENEMY TARGET:</div>
                                <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-[85px]">
                                    {aliveEnemies.map((enemy, idx) => (
                                        <button
                                            key={enemy.id}
                                            onClick={() => confirmEnemyTarget(enemy.id)}
                                            onMouseEnter={() => setSelectedEnemyTargetIdx(idx)}
                                            className="text-left text-xs sm:text-sm font-bold hover:text-yellow-300 truncate"
                                        >
                                            {aliveEnemies[selectedEnemyTargetIdx]?.id === enemy.id ? '👉 ' : '   '}
                                            {enemy.name}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setMenuView('main')} className="text-xs text-neutral-400 hover:text-white pt-1">
                                    [CANCEL]
                                </button>
                            </div>
                        )}

                        {/* MAGIC SUBMENU */}
                        {menuView === 'magic' && currentActiveHero && (
                            <div className="flex flex-col h-full justify-between p-1">
                                <div className="flex justify-between text-xs text-yellow-300 mb-1">
                                    <span>SPELLS:</span>
                                    <span>MP: {currentActiveHero.stats.mp}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-[80px]">
                                    {currentActiveHero.spells.map(spell => {
                                        const canCast = currentActiveHero.stats.mp >= spell.mpCost;
                                        return (
                                            <button
                                                key={spell.id}
                                                disabled={!canCast}
                                                onClick={() => {
                                                    setSelectedSpell(spell);
                                                    if (spell.type === 'heal' || spell.targetScope === 'single_ally') {
                                                        setMenuView('target_ally');
                                                        setLogAction(`CAST ${spell.name}`);
                                                        setLogResult('PICK ALLY');
                                                    } else if (spell.targetScope === 'all_enemies') {
                                                        confirmEnemyTarget('all');
                                                    } else {
                                                        setMenuView('target_enemy');
                                                        setLogAction(`CAST ${spell.name}`);
                                                        setLogResult('PICK ENEMY');
                                                    }
                                                }}
                                                className={`text-left text-xs font-bold truncate ${
                                                    canCast ? 'hover:text-yellow-300 text-white' : 'text-neutral-500 cursor-not-allowed'
                                                }`}
                                            >
                                                {spell.name} ({spell.mpCost})
                                            </button>
                                        );
                                    })}
                                </div>
                                <button onClick={() => setMenuView('main')} className="text-xs text-neutral-400 hover:text-white pt-1">
                                    [CANCEL]
                                </button>
                            </div>
                        )}

                        {/* ITEM / DRINK SUBMENU */}
                        {menuView === 'item' && (
                            <div className="flex flex-col h-full justify-between p-1">
                                <div className="text-xs text-yellow-300 mb-1">CHOOSE ITEM:</div>
                                <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-[80px]">
                                    {items.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setMenuView('target_ally');
                                                setLogAction(`USE ${item.name}`);
                                                setLogResult('PICK ALLY');
                                            }}
                                            className="text-left text-xs font-bold hover:text-yellow-300 text-white truncate"
                                        >
                                            {item.name} x{item.count}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setMenuView('main')} className="text-xs text-neutral-400 hover:text-white pt-1">
                                    [CANCEL]
                                </button>
                            </div>
                        )}

                        {/* TARGET ALLY SUBMENU */}
                        {menuView === 'target_ally' && (
                            <div className="flex flex-col h-full justify-between p-1">
                                <div className="text-xs text-emerald-300 mb-1">TARGET ALLY:</div>
                                <div className="grid grid-cols-2 gap-1">
                                    {party.map(hero => (
                                        <button
                                            key={hero.id}
                                            onClick={() => confirmAllyTarget(hero.id)}
                                            className="text-left text-xs font-bold hover:text-emerald-300 text-white truncate"
                                        >
                                            👉 {hero.name} ({hero.stats.hp})
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setMenuView('main')} className="text-xs text-neutral-400 hover:text-white pt-1">
                                    [CANCEL]
                                </button>
                            </div>
                        )}

                        {/* Resolving Phase Indicator */}
                        {combatPhase === 'resolving' && (
                            <div className="h-full flex items-center justify-center text-sm font-bold animate-pulse text-amber-400">
                                ⚔️ BATTLE IN PROGRESS...
                            </div>
                        )}

                        {/* Victory Phase UI */}
                        {combatPhase === 'victory' && (
                            <div className="h-full flex flex-col items-center justify-center gap-2">
                                <div className="text-emerald-400 font-black tracking-wider text-base">🎉 VICTORY!</div>
                                <button 
                                    onClick={() => onComplete(150)}
                                    className="px-4 py-1.5 bg-white text-black font-black uppercase text-sm hover:bg-yellow-300 transition"
                                >
                                    CONTINUE
                                </button>
                            </div>
                        )}

                        {/* Defeat Phase UI */}
                        {combatPhase === 'defeat' && (
                            <div className="h-full flex flex-col items-center justify-center gap-2">
                                <div className="text-rose-500 font-black tracking-wider text-base">💀 GAME OVER</div>
                                <button 
                                    onClick={onClose}
                                    className="px-4 py-1.5 bg-rose-600 text-white font-black uppercase text-sm hover:bg-rose-500 transition"
                                >
                                    RETREAT
                                </button>
                            </div>
                        )}
                    </div>

                    {/* BOTTOM BOX 3 (RIGHT): 4 STACKED PARTY HP STATUS WINDOWS */}
                    <div className="w-[28%] flex flex-col gap-1 justify-between">
                        {party.map((hero, idx) => {
                            const isCurrentChoosing = combatPhase === 'command' && activeHeroIdx === idx;
                            const isLowHp = hero.stats.hp <= hero.stats.maxHp * 0.3;

                            return (
                                <div 
                                    key={hero.id}
                                    className={`border-[2px] p-1 flex flex-col justify-center transition-all ${
                                        isCurrentChoosing 
                                            ? 'border-yellow-400 bg-[#16162a]' 
                                            : 'border-white bg-black'
                                    } ${!hero.isAlive ? 'opacity-40' : ''}`}
                                >
                                    <div className="flex justify-between items-center text-xs sm:text-sm font-bold leading-tight">
                                        <span className={isCurrentChoosing ? 'text-yellow-300' : 'text-white'}>
                                            {hero.name}
                                        </span>
                                        {hero.stats.maxMp > 0 && (
                                            <span className="text-[10px] text-sky-300 font-normal">
                                                MP {hero.stats.mp}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center text-xs sm:text-sm font-black leading-tight">
                                        <span className="text-neutral-400 font-bold">HP</span>
                                        <span className={isLowHp ? 'text-rose-400 animate-pulse' : 'text-white'}>
                                            {hero.stats.hp}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

            </div>
        </div>
    );
};

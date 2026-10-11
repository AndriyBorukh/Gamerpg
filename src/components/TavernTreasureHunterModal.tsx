import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Trophy, 
    RotateCcw, 
    X, 
    Play, 
    Volume2,
    VolumeX
} from 'lucide-react';
import { OpponentData } from '../types';

interface TavernTreasureHunterModalProps {
    isOpen: boolean;
    onClose: () => void;
    opponent: OpponentData | null;
    expectedXpReward?: number;
    onVictory: (rewardGold: number, xp: number, details?: string) => void;
    onDefeat: (xp: number) => void;
}

interface Platform {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Collectible {
    id: string;
    x: number;
    y: number;
    type: 'diamond' | 'gem' | 'coin' | 'key' | 'door' | 'crossbow';
    collected: boolean;
    isLocked?: boolean;
}

interface Projectile {
    x: number;
    y: number;
    vx: number;
    width: number;
    height: number;
}

interface Enemy {
    id: string;
    x: number;
    y: number;
    vx: number;
    width: number;
    height: number;
    startX: number;
    range: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const WORLD_WIDTH = 2400; // Expanded world width
const GRAVITY = 0.52;
const JUMP_FORCE = -11.5;
const MOVE_SPEED = 6.2;
const FLOOR_Y = 410;
const LEFT_WALL = 20;
const RIGHT_WALL = WORLD_WIDTH - 20; // Adjusted right wall

export default function TavernTreasureHunterModal({
    isOpen,
    onClose,
    opponent,
    expectedXpReward = 150,
    onVictory,
    onDefeat
}: TavernTreasureHunterModalProps) {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'victory' | 'defeat'>('menu');
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [finalScore, setFinalScore] = useState<number>(0);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const requestRef = useRef<number | null>(null);
    const cameraXRef = useRef<number>(0); // Side-scrolling camera

    // Direct DOM HUD refs to avoid React re-renders during gameplay (guarantees zero lag)
    const scoreTextRef = useRef<HTMLSpanElement | null>(null);
    const livesTextRef = useRef<HTMLSpanElement | null>(null);
    const timerTextRef = useRef<HTMLSpanElement | null>(null);
    const keyTextRef = useRef<HTMLSpanElement | null>(null);
    const levelTextRef = useRef<HTMLSpanElement | null>(null);

    // Game mutable state refs
    const scoreValRef = useRef<number>(0);
    const livesValRef = useRef<number>(3);
    const levelValRef = useRef<number>(1);
    const hasKeyRef = useRef<boolean>(false);
    const hasCrossbowRef = useRef<boolean>(false);
    const timerValRef = useRef<number>(120);
    const projectilesRef = useRef<Projectile[]>([]);

    // Audio context cache for zero-lag sound effects
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playerRef = useRef({
        x: 60,
        y: 350,
        prevY: 350,
        vx: 0,
        vy: 0,
        width: 26,
        height: 38,
        facing: 'right' as 'left' | 'right',
        isGrounded: false,
        walkAnim: 0
    });

    const coyoteTimerRef = useRef<number>(0);
    const jumpBufferRef = useRef<number>(0);
    const keysPressedRef = useRef<{ [key: string]: boolean }>({});
    const platformsRef = useRef<Platform[]>([]);
    const collectiblesRef = useRef<Collectible[]>([]);
    const enemiesRef = useRef<Enemy[]>([]);

    const playSound = useCallback((type: 'jump' | 'coin' | 'key' | 'door' | 'hit' | 'win') => {
        if (!soundEnabled) return;
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            if (type === 'jump') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'coin') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'key') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.08);
                osc.frequency.setValueAtTime(784, now + 0.16);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'door' || type === 'win') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554, now + 0.1);
                osc.frequency.setValueAtTime(659, now + 0.2);
                osc.frequency.setValueAtTime(880, now + 0.3);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.45);
                osc.start(now);
                osc.stop(now + 0.45);
            } else if (type === 'hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.linearRampToValueAtTime(60, now + 0.2);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            }
        } catch {
            // Audio error ignored
        }
    }, [soundEnabled]);

    const updateHUD = () => {
        if (scoreTextRef.current) scoreTextRef.current.textContent = String(scoreValRef.current);
        if (livesTextRef.current) livesTextRef.current.textContent = '❤️'.repeat(Math.max(0, livesValRef.current));
        if (timerTextRef.current) {
            const mins = Math.floor(timerValRef.current / 60);
            const secs = timerValRef.current % 60;
            timerTextRef.current.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
        }
        if (keyTextRef.current) {
            keyTextRef.current.textContent = hasKeyRef.current ? '🔑 КЛЮЧ Є' : '🔒 НЕМАЄ КЛЮЧА';
            keyTextRef.current.className = hasKeyRef.current 
                ? 'bg-stone-900 px-3 py-1.5 rounded-lg border border-amber-400 text-amber-300 font-bold text-xs' 
                : 'bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-700 text-stone-500 font-bold text-xs';
        }
        if (levelTextRef.current) levelTextRef.current.textContent = `${levelValRef.current} / 3`;
    };

    const generateLevel = (lvl: number) => {
        const plats: Platform[] = [
            { x: 0, y: FLOOR_Y, width: WORLD_WIDTH, height: 40 }, // Expanded ground floor
            { x: 0, y: 0, width: 20, height: CANVAS_HEIGHT }, // Left border
            { x: WORLD_WIDTH - 20, y: 0, width: 20, height: CANVAS_HEIGHT } // Right border
        ];

        // Procedural generation logic
        const numPlatforms = 15 + lvl * 5;
        for (let i = 0; i < numPlatforms; i++) {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 50) {
                const width = 80 + Math.random() * 100;
                const x = 50 + Math.random() * (WORLD_WIDTH - width - 100);
                const y = 100 + Math.random() * 250;
                
                const newPlat = { x, y, width, height: 22 };
                
                // Check overlap with existing platforms
                let overlap = false;
                for (const plat of plats) {
                    if (newPlat.x < plat.x + plat.width &&
                        newPlat.x + newPlat.width > plat.x &&
                        newPlat.y < plat.y + plat.height &&
                        newPlat.y + newPlat.height > plat.y) {
                        overlap = true;
                        break;
                    }
                }
                
                if (!overlap) {
                    plats.push(newPlat);
                    placed = true;
                }
                attempts++;
            }
        }
        return plats;
    };

    const loadLevel = useCallback((lvl: number) => {
        levelValRef.current = lvl;
        hasKeyRef.current = false;
        hasCrossbowRef.current = false;
        timerValRef.current = 120;
        cameraXRef.current = 0; // Reset camera
        projectilesRef.current = []; // Clear projectiles

        playerRef.current = {
            x: 60,
            y: 350,
            prevY: 350,
            vx: 0,
            vy: 0,
            width: 26,
            height: 38,
            facing: 'right',
            isGrounded: false,
            walkAnim: 0
        };

        coyoteTimerRef.current = 0;
        jumpBufferRef.current = 0;

        platformsRef.current = generateLevel(lvl);

        // Place collectibles and enemies on platforms
        const items: Collectible[] = [];
        const enemies: Enemy[] = [];
        
        platformsRef.current.forEach((plat, index) => {
            if (index < 3) return; // Skip boundaries
            if (Math.random() > 0.5) {
                items.push({ 
                    id: `c${index}`, 
                    x: plat.x + plat.width / 2 - 12, 
                    y: plat.y - 30, 
                    type: Math.random() > 0.5 ? 'diamond' : 'gem', 
                    collected: false 
                });
            }
            if (Math.random() > 0.7) {
                enemies.push({ 
                    id: `g${index}`, 
                    x: plat.x + 10, 
                    y: plat.y - 28, 
                    vx: 1 + Math.random(), 
                    width: 28, 
                    height: 28, 
                    startX: plat.x, 
                    range: plat.width - 28 
                });
            }
        });

        // Add key, crossbow and door
        const validPlats = platformsRef.current.filter((_, index) => index >= 3);
        
        if (validPlats.length > 0) {
            // Place key on a random platform
            const keyPlat = validPlats[Math.floor(Math.random() * validPlats.length)];
            items.push({ id: 'key', x: keyPlat.x + keyPlat.width / 2 - 10, y: keyPlat.y - 28, type: 'key', collected: false });
            
            // Place crossbow on a different platform if possible
            if (validPlats.length > 1) {
                let crossbowPlat = validPlats[Math.floor(Math.random() * validPlats.length)];
                while (crossbowPlat === keyPlat) {
                     crossbowPlat = validPlats[Math.floor(Math.random() * validPlats.length)];
                }
                items.push({ id: 'crossbow', x: crossbowPlat.x + crossbowPlat.width / 2 - 10, y: crossbowPlat.y - 28, type: 'crossbow', collected: false });
            } else {
                 items.push({ id: 'crossbow', x: 200, y: 300, type: 'crossbow', collected: false });
            }
        } else {
            items.push({ id: 'key', x: WORLD_WIDTH - 100, y: 50, type: 'key', collected: false });
            items.push({ id: 'crossbow', x: 200, y: 300, type: 'crossbow', collected: false });
        }
        
        items.push({ id: 'door', x: WORLD_WIDTH - 60, y: 352, type: 'door', collected: false, isLocked: true });

        collectiblesRef.current = items;
        enemiesRef.current = enemies;

        updateHUD();
    }, []);


    const startNewGame = () => {
        scoreValRef.current = 0;
        livesValRef.current = 3;
        loadLevel(1);
        setGameState('playing');
    };

    const triggerJump = useCallback(() => {
        jumpBufferRef.current = 8; // buffer jump for 8 ticks (~130ms)
        const p = playerRef.current;
        if (p.isGrounded || coyoteTimerRef.current > 0) {
            p.vy = JUMP_FORCE;
            p.isGrounded = false;
            coyoteTimerRef.current = 0;
            jumpBufferRef.current = 0;
            playSound('jump');
        }
    }, [playSound]);

    // High-precision 60Hz Physics & Render Loop
    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const timerInterval = setInterval(() => {
            timerValRef.current -= 1;
            if (timerValRef.current <= 0) {
                livesValRef.current -= 1;
                updateHUD();
                if (livesValRef.current <= 0) {
                    setGameState('defeat');
                    onDefeat(Math.floor(expectedXpReward * 0.3));
                } else {
                    playSound('hit');
                    loadLevel(levelValRef.current);
                }
            } else {
                updateHUD();
            }
        }, 1000);

        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressedRef.current[e.key] = true;
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                triggerJump();
                e.preventDefault();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressedRef.current[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Fixed timestep physics runner
        const physicsStep = () => {
            const p = playerRef.current;
            const keys = keysPressedRef.current;

            // 1. Horizontal input calculation
            let moveDir = 0;
            if (keys['ArrowLeft'] || keys['a'] || keys['A'] || keys['btn_left']) {
                moveDir -= 1;
            }
            if (keys['ArrowRight'] || keys['d'] || keys['D'] || keys['btn_right']) {
                moveDir += 1;
            }

            if (moveDir < 0) p.facing = 'left';
            if (moveDir > 0) p.facing = 'right';

            // 2. Smooth velocity transition (acceleration and friction)
            const targetVx = moveDir * MOVE_SPEED;
            if (moveDir !== 0) {
                p.vx += (targetVx - p.vx) * 0.32;
                p.walkAnim += 0.25;
            } else {
                p.vx *= 0.82;
                if (Math.abs(p.vx) < 0.05) p.vx = 0;
                p.walkAnim = 0;
            }

            // 3. Move X position
            p.x += p.vx;

            // 4. Smooth boundary clamps (never snap across the map)
            if (p.x < 0) {
                p.x = 0;
                p.vx = 0;
            } else if (p.x + p.width > WORLD_WIDTH) {
                p.x = WORLD_WIDTH - p.width;
                p.vx = 0;
            }

            // Update Camera
            cameraXRef.current = Math.max(0, Math.min(p.x - CANVAS_WIDTH / 2, WORLD_WIDTH - CANVAS_WIDTH));

            // 5. Jump buffer and Coyote time logic
            if (p.isGrounded) {
                coyoteTimerRef.current = 6; // 6 ticks of coyote grace
            } else if (coyoteTimerRef.current > 0) {
                coyoteTimerRef.current -= 1;
            }

            if (jumpBufferRef.current > 0) {
                jumpBufferRef.current -= 1;
                if (coyoteTimerRef.current > 0) {
                    p.vy = JUMP_FORCE;
                    p.isGrounded = false;
                    coyoteTimerRef.current = 0;
                    jumpBufferRef.current = 0;
                    playSound('jump');
                }
            }

            // 6. Record previous Y for precise landing detection
            p.prevY = p.y;

            // 7. Gravity and vertical move
            p.vy += GRAVITY;
            p.y += p.vy;
            p.isGrounded = false;

            // 8. Ground Floor collision (solid bottom)
            if (p.y + p.height >= FLOOR_Y) {
                p.y = FLOOR_Y - p.height;
                p.vy = 0;
                p.isGrounded = true;
            }

            // 9. Ledges (floating suspended platforms)
            // One-way landing: only lands if falling (vy >= 0) and crossed the top threshold
            if (p.vy >= 0) {
                for (const plat of platformsRef.current) {
                    if (plat.y >= FLOOR_Y || plat.height > 30) continue; // skip walls and ground

                    const prevFeet = p.prevY + p.height;
                    const currFeet = p.y + p.height;
                    const platTop = plat.y;

                    // Did the feet cross from above/on top into the platform?
                    if (prevFeet <= platTop + 7 && currFeet >= platTop) {
                        // Check horizontal footprint overlap with generous edge margin
                        if (p.x + p.width > plat.x + 2 && p.x < plat.x + plat.width - 2) {
                            p.y = platTop - p.height;
                            p.vy = 0;
                            p.isGrounded = true;
                            break;
                        }
                    }
                }
            }

            // 10. Screen top limit
            if (p.y < 0) {
                p.y = 0;
                p.vy = 0;
            }

            // 11. Safety fall check
            if (p.y > CANVAS_HEIGHT + 40) {
                livesValRef.current -= 1;
                updateHUD();
                if (livesValRef.current <= 0) {
                    setGameState('defeat');
                    onDefeat(Math.floor(expectedXpReward * 0.3));
                    return;
                }
                playSound('hit');
                loadLevel(levelValRef.current);
                return;
            }

            // 12. Collectibles check
            collectiblesRef.current.forEach(item => {
                if (item.collected) return;
                const itemBox = { x: item.x, y: item.y, width: 24, height: 24 };
                if (
                    p.x < itemBox.x + itemBox.width &&
                    p.x + p.width > itemBox.x &&
                    p.y < itemBox.y + itemBox.height &&
                    p.y + p.height > itemBox.y
                ) {
                    if (item.type === 'key') {
                        item.collected = true;
                        hasKeyRef.current = true;
                        updateHUD();
                        playSound('key');
                    } else if (item.type === 'crossbow') {
                        item.collected = true;
                        hasCrossbowRef.current = true;
                        updateHUD();
                        playSound('key');
                    } else if (item.type === 'diamond') {
                        item.collected = true;
                        scoreValRef.current += 200;
                        updateHUD();
                        playSound('coin');
                    } else if (item.type === 'gem') {
                        item.collected = true;
                        scoreValRef.current += 350;
                        updateHUD();
                        playSound('coin');
                    } else if (item.type === 'coin') {
                        item.collected = true;
                        scoreValRef.current += 100;
                        updateHUD();
                        playSound('coin');
                    } else if (item.type === 'door') {
                        if (hasKeyRef.current || levelValRef.current > 2) {
                            playSound('win');
                            if (levelValRef.current >= 3) {
                                setFinalScore(scoreValRef.current);
                                setGameState('victory');
                                onVictory(scoreValRef.current + 500, expectedXpReward, `Пройдено всі 3 рівні Шукача Скарбів! Рахунок: ${scoreValRef.current}`);
                            } else {
                                loadLevel(levelValRef.current + 1);
                            }
                        } else {
                            playSound('hit');
                        }
                    }
                }
            });

            // 12b. Projectile logic
            if (hasCrossbowRef.current && keys['Control']) {
                if (projectilesRef.current.length < 3) {
                    projectilesRef.current.push({
                        x: p.x + (p.facing === 'right' ? p.width : -10),
                        y: p.y + p.height / 2,
                        vx: p.facing === 'right' ? 10 : -10,
                        width: 10,
                        height: 4
                    });
                    // Simple cooldown could be added here
                    keys['Control'] = false; // crude cooldown
                }
            }

            projectilesRef.current.forEach((proj, index) => {
                proj.x += proj.vx;
                if (proj.x < 0 || proj.x > WORLD_WIDTH) {
                    projectilesRef.current.splice(index, 1);
                    return;
                }
                
                // Collision with enemies
                enemiesRef.current.forEach((enemy, eIndex) => {
                    if (
                        proj.x < enemy.x + enemy.width &&
                        proj.x + proj.width > enemy.x &&
                        proj.y < enemy.y + enemy.height &&
                        proj.y + proj.height > enemy.y
                    ) {
                        enemiesRef.current.splice(eIndex, 1);
                        projectilesRef.current.splice(index, 1);
                        playSound('hit');
                    }
                });
            });

            // 13. Enemy collision and update
            enemiesRef.current.forEach(enemy => {
                // Move enemy
                enemy.x += enemy.vx;
                if (enemy.x < enemy.startX || enemy.x > enemy.startX + enemy.range) {
                    enemy.vx *= -1;
                }

                // Check collision with player
                const playerBox = { x: p.x, y: p.y, width: p.width, height: p.height };
                const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };

                if (
                    playerBox.x < enemyBox.x + enemyBox.width &&
                    playerBox.x + playerBox.width > enemyBox.x &&
                    playerBox.y < enemyBox.y + enemyBox.height &&
                    playerBox.y + playerBox.height > enemyBox.y
                ) {
                    // Player hit
                    livesValRef.current -= 1;
                    updateHUD();
                    playSound('hit');
                    if (livesValRef.current <= 0) {
                        setGameState('defeat');
                        onDefeat(Math.floor(expectedXpReward * 0.3));
                    } else {
                        // Reset player position on hit
                        p.x = 60;
                        p.y = 350;
                        p.vx = 0;
                        p.vy = 0;
                    }
                }
            });
        };

        const renderGame = () => {
            const p = playerRef.current;

            // Clear background
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.save();
            ctx.translate(-cameraXRef.current, 0);

            // Draw side castle pillars (boundary borders)
            ctx.fillStyle = '#450a0a';
            ctx.fillRect(0, 0, 20, CANVAS_HEIGHT);
            ctx.fillRect(WORLD_WIDTH - 20, 0, 20, CANVAS_HEIGHT);
            ctx.strokeStyle = '#2b0606';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, 20, CANVAS_HEIGHT);
            ctx.strokeRect(WORLD_WIDTH - 20, 0, 20, CANVAS_HEIGHT);

            // Draw platforms
            platformsRef.current.forEach(plat => {
                // Skip boundaries which are already drawn (now they are at 0 and WORLD_WIDTH - 20)
                if (plat.width < 30 && (plat.x < 30 || plat.x > WORLD_WIDTH - 30)) return;

                // Medieval red-brick platform
                ctx.fillStyle = '#b91c1c';
                ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

                // Brick top highlight
                ctx.fillStyle = '#f87171';
                ctx.fillRect(plat.x, plat.y, plat.width, 2);

                // Platform border
                ctx.strokeStyle = '#7f1d1d';
                ctx.lineWidth = 2;
                ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);

                // Brick pattern joints
                ctx.fillStyle = '#7f1d1d';
                for (let bx = plat.x + 16; bx < plat.x + plat.width; bx += 24) {
                    ctx.fillRect(bx, plat.y + 2, 2, plat.height - 4);
                }
            });

            // Draw collectibles
            collectiblesRef.current.forEach(item => {
                if (item.collected) return;
                ctx.save();
                if (item.type === 'diamond') {
                    ctx.fillStyle = '#38bdf8';
                    ctx.beginPath();
                    ctx.moveTo(item.x + 12, item.y);
                    ctx.lineTo(item.x + 24, item.y + 12);
                    ctx.lineTo(item.x + 12, item.y + 24);
                    ctx.lineTo(item.x, item.y + 12);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#bae6fd';
                    ctx.stroke();
                } else if (item.type === 'gem') {
                    ctx.fillStyle = '#f43f5e';
                    ctx.beginPath();
                    ctx.arc(item.x + 12, item.y + 12, 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#fda4af';
                    ctx.stroke();
                } else if (item.type === 'coin') {
                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(item.x + 12, item.y + 12, 9, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ca8a04';
                    ctx.stroke();
                    ctx.fillStyle = '#854d0e';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.fillText('$', item.x + 8, item.y + 16);
                } else if (item.type === 'key') {
                    ctx.fillStyle = '#fde047';
                    ctx.fillRect(item.x + 8, item.y + 4, 8, 16);
                    ctx.beginPath();
                    ctx.arc(item.x + 12, item.y + 6, 5, 0, Math.PI * 2);
                    ctx.fill();
                } else if (item.type === 'crossbow') {
                    ctx.fillStyle = '#f59e0b';
                    // Crossbow shape: a horizontal bar and a vertical short one
                    ctx.fillRect(item.x + 4, item.y + 10, 16, 4);
                    ctx.fillRect(item.x + 12, item.y + 6, 4, 12);
                } else if (item.type === 'door') {
                    ctx.fillStyle = '#9a3412';
                    ctx.fillRect(item.x, item.y - 12, 36, 52);
                    ctx.strokeStyle = hasKeyRef.current ? '#facc15' : '#78716c';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(item.x, item.y - 12, 36, 52);
                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(item.x + 28, item.y + 14, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            });

            // Draw Player (Dave / Hunter) with clean sub-pixel rounding
            const px = Math.round(p.x);
            const py = Math.round(p.y);
            const legOffset = Math.sin(p.walkAnim) * 2;

            ctx.save();
            // Legs / Armor Legs
            ctx.fillStyle = '#475569'; // Slate armor
            ctx.fillRect(px + 5, py + 22, 6, 16 + (p.isGrounded ? legOffset : 0));
            ctx.fillRect(px + 15, py + 22, 6, 16 - (p.isGrounded ? legOffset : 0));

            // Torso / Chestplate
            ctx.fillStyle = '#94a3b8'; // Silver armor
            ctx.fillRect(px + 5, py + 10, 16, 13);
            
            // Shoulders
            ctx.fillStyle = '#64748b'; // Darker silver for shoulder pads
            ctx.fillRect(px + 3, py + 10, 20, 5);

            // Head / Helmet
            ctx.fillStyle = '#cbd5e1'; // Light grey/silver helmet
            ctx.fillRect(px + 7, py + 2, 12, 9);
            
            // Helmet Visor
            ctx.fillStyle = '#334155'; // Dark visor slot
            ctx.fillRect(px + 9, py + 4, 8, 3);

            // Plume / Cape detail
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(px + 5, py, 16, 2); // Plume base
            if (p.facing === 'right') {
                ctx.fillRect(px + 19, py + 1, 4, 2); // Plume tip
            } else {
                ctx.fillRect(px + 3, py + 1, 4, 2); // Plume tip
            }
            ctx.restore();

            // Draw projectiles
            ctx.fillStyle = '#fde047';
            projectilesRef.current.forEach(proj => {
                ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
            });

            // Draw Goblin Enemies
            enemiesRef.current.forEach(enemy => {
                ctx.save();
                ctx.translate(enemy.x, enemy.y);
                
                // Body
                ctx.fillStyle = '#16a34a'; // Green skin/body
                ctx.fillRect(4, 8, 16, 16);

                // Head
                ctx.fillStyle = '#22c55e'; // Lighter green
                ctx.fillRect(6, 0, 12, 12);

                // Cap
                ctx.fillStyle = '#c2410c'; // Brownish/Orange cap
                ctx.fillRect(8, -4, 10, 6);
                ctx.fillStyle = '#9a3412'; // Cap shadow/band
                ctx.fillRect(8, 0, 10, 2); 

                // Ears
                ctx.fillStyle = '#16a34a';
                ctx.fillRect(2, 4, 4, 4); // Left ear
                ctx.fillRect(18, 4, 4, 4); // Right ear

                // Eyes
                ctx.fillStyle = 'white';
                ctx.fillRect(8, 2, 2, 2); // Left eye
                ctx.fillRect(14, 2, 2, 2); // Right eye
                ctx.fillStyle = 'black'; // Pupils
                ctx.fillRect(9, 3, 1, 1);
                ctx.fillRect(15, 3, 1, 1);
                
                // Eyebrows
                ctx.fillStyle = '#14532d';
                ctx.fillRect(8, 1, 3, 1);
                ctx.fillRect(13, 1, 3, 1);

                // Nose
                ctx.fillStyle = '#15803d';
                ctx.fillRect(10, 5, 2, 2);

                // Mouth/Smirk
                ctx.fillStyle = '#064e3b';
                ctx.fillRect(8, 9, 8, 2);
                // Teeth
                ctx.fillStyle = '#fef3c7';
                ctx.fillRect(9, 10, 1, 1);
                ctx.fillRect(13, 10, 1, 1);

                // Axe
                ctx.fillStyle = '#a1a1aa'; // Grey axe blade
                ctx.fillRect(0, 8, 6, 8);
                ctx.fillStyle = '#e4e4e7'; // Blade edge
                ctx.fillRect(0, 8, 2, 8);
                ctx.fillStyle = '#57534e'; // Handle grip
                ctx.fillRect(2, 8, 2, 16);
                ctx.fillStyle = '#78350f'; // Handle end
                ctx.fillRect(2, 22, 2, 2);
                
                ctx.restore();
            });
            ctx.restore();
        };

        // Fixed timestep 60Hz loop
        let lastTime = performance.now();
        let accumulator = 0;
        const FIXED_STEP = 1000 / 60; // 16.666 ms

        const mainLoop = (currentTime: number) => {
            const frameDelta = Math.min(currentTime - lastTime, 45); // prevent spiral on tab pause
            lastTime = currentTime;
            accumulator += frameDelta;

            while (accumulator >= FIXED_STEP) {
                physicsStep();
                accumulator -= FIXED_STEP;
            }

            renderGame();
            requestRef.current = requestAnimationFrame(mainLoop);
        };

        requestRef.current = requestAnimationFrame(mainLoop);
        updateHUD();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            clearInterval(timerInterval);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState, onDefeat, onVictory, expectedXpReward, playSound, loadLevel, triggerJump]);

    const setKey = (key: string, pressed: boolean) => {
        keysPressedRef.current[key] = pressed;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full max-w-[880px] bg-[#141218] border-2 border-yellow-600/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-stone-900 via-amber-950/60 to-stone-900 border-b border-yellow-600/40">
                        <div className="flex items-center space-x-3">
                            <span className="text-3xl">🪙</span>
                            <div>
                                <h2 className="text-xl font-black text-yellow-400 tracking-wide">ШУКАЧ СКАРБІВ (ПЛАТФОРМЕР)</h2>
                                <p className="text-xs text-stone-400">
                                    {opponent ? `Суперник у таверні: ${opponent.name}` : 'Класична пригодницька аркада'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-stone-400 hover:text-white bg-stone-800/80 hover:bg-stone-700 rounded-xl transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 flex flex-col items-center justify-center min-h-[520px]">
                        {gameState === 'menu' && (
                            <div className="flex flex-col items-center text-center max-w-lg space-y-6 py-6">
                                <div className="text-6xl text-yellow-400 animate-bounce">🗝️</div>
                                <h3 className="text-2xl font-black text-yellow-300">ВХІД У ПІДЗЕМЕЛЛЯ СКАРБІВ</h3>
                                <p className="text-stone-300 text-sm leading-relaxed">
                                    Збирайте діаманти, рубіни, золото та знайдіть ключ, щоб відчинити двері виходу. Остерігайтеся прірв та встигніть за 2 хвилини!
                                </p>
                                <div className="bg-stone-900/90 border border-yellow-600/40 p-4 rounded-xl w-full text-left space-y-2 text-xs text-stone-300">
                                    <div className="font-bold text-yellow-400 mb-1">🎮 Керування:</div>
                                    <div>• Рух: клавіші <span className="text-yellow-300 font-bold">A / D</span> або <span className="text-yellow-300 font-bold">← / →</span></div>
                                    <div>• Стрибок: клавіша <span className="text-yellow-300 font-bold">Space</span> або <span className="text-yellow-300 font-bold">W / ↑</span></div>
                                    <div>• Також доступні сенсорні кнопки на екрані без жодної затримки!</div>
                                </div>
                                <button
                                    onClick={startNewGame}
                                    className="px-8 py-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 text-stone-950 font-black rounded-xl shadow-xl flex items-center gap-3 text-lg transition transform hover:scale-105"
                                >
                                    <Play className="w-6 h-6 fill-stone-950" /> РОЗПОЧАТИ ГРУ
                                </button>
                            </div>
                        )}

                        {gameState === 'playing' && (
                            <div className="flex flex-col items-center space-y-4 w-full">
                                {/* HUD */}
                                <div className="flex items-center justify-between w-full max-w-[800px] px-2 text-sm font-bold text-stone-300">
                                    <div className="flex items-center gap-4">
                                        <span className="bg-stone-900 px-3 py-1.5 rounded-lg border border-yellow-600/40 text-yellow-400">
                                            🧭 Рівень: <span ref={levelTextRef}>1 / 3</span>
                                        </span>
                                        <span className="bg-stone-900 px-3 py-1.5 rounded-lg border border-yellow-600/40 text-cyan-400">
                                            💎 Рахунок: <span ref={scoreTextRef}>0</span>
                                        </span>
                                        <span ref={keyTextRef} className="bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-700 text-stone-500 font-bold text-xs">
                                            🔒 НЕМАЄ КЛЮЧА
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-rose-500 font-bold tracking-wider">
                                            <span ref={livesTextRef}>❤️❤️❤️</span>
                                        </div>
                                        <span className="bg-stone-900 px-3 py-1.5 rounded-lg border border-amber-600/40 text-amber-300">
                                            ⏳ <span ref={timerTextRef}>2:00</span>
                                        </span>
                                        <button
                                            onClick={() => setSoundEnabled(!soundEnabled)}
                                            className="p-2 bg-stone-900 hover:bg-stone-800 rounded-lg text-yellow-400 border border-yellow-600/40"
                                            title="Звук"
                                        >
                                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Canvas Game Screen */}
                                <div className="relative border-2 border-yellow-600/50 rounded-xl overflow-hidden shadow-2xl bg-black">
                                    <canvas 
                                        ref={canvasRef}
                                        width={CANVAS_WIDTH}
                                        height={CANVAS_HEIGHT}
                                        className="block touch-none"
                                    />
                                </div>

                                {/* On-Screen Touch Controls */}
                                <div className="flex items-center justify-between w-full max-w-[800px] px-2 select-none touch-none">
                                    <div className="flex gap-3">
                                        <button 
                                            onMouseDown={(e) => { e.preventDefault(); setKey('btn_left', true); }}
                                            onMouseUp={(e) => { e.preventDefault(); setKey('btn_left', false); }}
                                            onMouseLeave={() => setKey('btn_left', false)}
                                            onTouchStart={(e) => { e.preventDefault(); setKey('btn_left', true); }}
                                            onTouchEnd={(e) => { e.preventDefault(); setKey('btn_left', false)} }
                                            onTouchCancel={(e) => { e.preventDefault(); setKey('btn_left', false); }}
                                            className="px-7 py-3.5 bg-stone-800 hover:bg-stone-700 active:bg-yellow-600 text-yellow-300 font-black rounded-xl border border-stone-700 shadow-lg transition transform active:scale-95 touch-none"
                                        >
                                            ◀ ЛІВОРУЧ
                                        </button>
                                        <button 
                                            onMouseDown={(e) => { e.preventDefault(); setKey('btn_right', true); }}
                                            onMouseUp={(e) => { e.preventDefault(); setKey('btn_right', false); }}
                                            onMouseLeave={() => setKey('btn_right', false)}
                                            onTouchStart={(e) => { e.preventDefault(); setKey('btn_right', true); }}
                                            onTouchEnd={(e) => { e.preventDefault(); setKey('btn_right', false); }}
                                            onTouchCancel={(e) => { e.preventDefault(); setKey('btn_right', false); }}
                                            className="px-7 py-3.5 bg-stone-800 hover:bg-stone-700 active:bg-yellow-600 text-yellow-300 font-black rounded-xl border border-stone-700 shadow-lg transition transform active:scale-95 touch-none"
                                        >
                                            ПРАВОРУЧ ▶
                                        </button>
                                    </div>
                                    <button 
                                        onMouseDown={(e) => { e.preventDefault(); triggerJump(); }}
                                        onTouchStart={(e) => { e.preventDefault(); triggerJump(); }}
                                        className="px-9 py-3.5 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 active:scale-95 text-stone-950 font-black rounded-xl shadow-lg border border-yellow-400 transition touch-none"
                                    >
                                        ▲ СТРИБОК (SPACE)
                                    </button>
                                </div>
                            </div>
                        )}

                        {gameState === 'victory' && (
                            <div className="flex flex-col items-center text-center max-w-lg space-y-6 py-8">
                                <div className="text-6xl text-yellow-400 animate-bounce">🏆</div>
                                <h3 className="text-3xl font-black text-emerald-400">ШУКАЧ СКАРБІВ УСПІШНО ПРОЙДЕНИЙ!</h3>
                                <p className="text-stone-300">
                                    Ви зібрали всі скарби, успішно подолали рівні та відчинили двері нагороди!
                                </p>
                                <div className="bg-stone-900 px-6 py-4 rounded-xl border border-yellow-600/40 w-full space-y-2">
                                    <div className="flex justify-between text-stone-300">
                                        <span>Набрано балів:</span>
                                        <span className="text-yellow-300 font-bold">{finalScore}</span>
                                    </div>
                                    <div className="flex justify-between text-stone-300">
                                        <span>Отримано досвіду:</span>
                                        <span className="text-emerald-400 font-bold">+{expectedXpReward} XP</span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black rounded-xl shadow-lg transition"
                                >
                                    ЗАБРАТИ НАГОРОДУ ТА ПОВЕРНУТИСЯ
                                </button>
                            </div>
                        )}

                        {gameState === 'defeat' && (
                            <div className="flex flex-col items-center text-center max-w-lg space-y-6 py-8">
                                <div className="text-6xl text-rose-500 animate-pulse">💀</div>
                                <h3 className="text-3xl font-black text-rose-400">ЖИТТЯ ВИЧЕРПАНО!</h3>
                                <p className="text-stone-300">
                                    На жаль, усі спроби Дейва вичерпано. Але таверна завжди готова прийняти нового шукача скарбів!
                                </p>
                                <button
                                    onClick={startNewGame}
                                    className="px-8 py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-black rounded-xl shadow-lg flex items-center gap-2 transition"
                                >
                                    <RotateCcw className="w-5 h-5" /> СПРОБУВАТИ ЗНОВУ
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

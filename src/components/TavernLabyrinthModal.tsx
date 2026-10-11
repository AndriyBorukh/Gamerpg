import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Clock, 
    Coins, 
    Compass, 
    Key, 
    Flame, 
    Footprints, 
    Eye, 
    EyeOff, 
    Volume2, 
    VolumeX, 
    X, 
    Trophy, 
    Sparkles, 
    RotateCcw, 
    Zap, 
    CheckCircle2, 
    AlertTriangle,
    ShieldAlert,
    HelpCircle,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Hourglass
} from 'lucide-react';
import { OpponentData, WorldProgress } from '../types';
import { getSharedAudioContext, playVictorySound, playDefeatSound, playGoldSound } from '../lib/soundEffects';

export interface TavernLabyrinthModalProps {
    expectedXpReward?: number;
    isOpen: boolean;
    opponent?: OpponentData;
    tavernName: string;
    progress?: WorldProgress;
    onUpdateProgress?: (updated: WorldProgress) => void;
    onVictory: (bonusGold?: number) => void;
    onDefeat: () => void;
    onClose: () => void;
}

type MazeDifficulty = 'easy' | 'normal' | 'hard';

interface MazeConfig {
    size: number; // grid size (odd number)
    name: string;
    description: string;
    coinCount: number;
    gemCount: number;
    hourglassCount: number;
    keyDoorCount: number;
}

const MAZE_CONFIGS: Record<MazeDifficulty, MazeConfig> = {
    easy: {
        size: 15,
        name: 'Підвал Таверни',
        description: 'Компактний лабіринт винних погребів. Ідеальний для швидкої розвідки.',
        coinCount: 6,
        gemCount: 2,
        hourglassCount: 2,
        keyDoorCount: 1
    },
    normal: {
        size: 21,
        name: 'Катакомби Таверни',
        description: 'Старовинні заплутані ходи під таверною. Баланс скринь, дверей та пасток.',
        coinCount: 10,
        gemCount: 3,
        hourglassCount: 3,
        keyDoorCount: 2
    },
    hard: {
        size: 27,
        name: 'Лабіринт Мінотавра',
        description: 'Величезні кам\'яні катакомби з безліччю поворотів та схованок.',
        coinCount: 16,
        gemCount: 5,
        hourglassCount: 4,
        keyDoorCount: 3
    }
};

type ItemType = 'coin' | 'gem' | 'key' | 'door' | 'hourglass' | 'boots';

interface LabyrinthCell {
    x: number;
    y: number;
    isWall: boolean;
    isStart: boolean;
    isExit: boolean;
    item?: ItemType;
    isDoorLocked?: boolean;
}

export default function TavernLabyrinthModal({
    expectedXpReward = 120,
    isOpen,
    opponent,
    tavernName,
    progress,
    onUpdateProgress,
    onVictory,
    onDefeat,
    onClose
}: TavernLabyrinthModalProps) {
    const TOTAL_TIME_SECONDS = 180; // 3 minutes strictly as requested by user

    const [difficulty, setDifficulty] = useState<MazeDifficulty>('normal');
    const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TIME_SECONDS);
    const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'victory' | 'defeat'>('intro');

    // Player position and inventory
    const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
    const [playerFacing, setPlayerFacing] = useState<'up' | 'down' | 'left' | 'right'>('right');
    const [keysCount, setKeysCount] = useState<number>(0);
    const [goldCollected, setGoldCollected] = useState<number>(0);
    const [gemsCollected, setGemsCollected] = useState<number>(0);
    const [speedBoostTimer, setSpeedBoostTimer] = useState<number>(0);
    const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set());

    // Settings
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [fogOfWar, setFogOfWar] = useState<boolean>(false); // Default top-down clear view, toggleable
    const [showBreadcrumbs, setShowBreadcrumbs] = useState<boolean>(true);
    const [showRules, setShowRules] = useState<boolean>(false);

    // Floating notifications
    const [floatText, setFloatText] = useState<{ id: number; text: string; color: string }[]>([]);

    // Maze structure
    const [mazeGrid, setMazeGrid] = useState<LabyrinthCell[][]>([]);
    const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
    const [exitPos, setExitPos] = useState<{ x: number; y: number }>({ x: 19, y: 19 });

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const floatIdRef = useRef<number>(0);
    const lastMoveTimeRef = useRef<number>(0);

    const addFloatingNotice = (text: string, color: string = 'text-yellow-300') => {
        const id = ++floatIdRef.current;
        setFloatText(prev => [...prev.slice(-3), { id, text, color }]);
        setTimeout(() => {
            setFloatText(prev => prev.filter(item => item.id !== id));
        }, 2200);
    };

    // Synthesized Sound Effects
    const playMazeSound = (type: 'step' | 'coin' | 'key' | 'door' | 'time' | 'boots' | 'warn' | 'win' | 'lose') => {
        if (!soundEnabled) return;
        try {
            const ctx = getSharedAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            if (type === 'step') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(140 + Math.random() * 40, now);
                osc.frequency.exponentialRampToValueAtTime(70, now + 0.06);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.06);
            } else if (type === 'coin') {
                playGoldSound();
            } else if (type === 'key') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.setValueAtTime(1600, now + 0.08);
                osc.frequency.setValueAtTime(2200, now + 0.16);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'door') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(280, now + 0.25);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'time') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === 'boots') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'warn') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'win') {
                playVictorySound();
            } else if (type === 'lose') {
                playDefeatSound();
            }
        } catch {
            // Audio context safely ignored if unavailable
        }
    };

    // Recursive Backtracker Maze Generator
    const generateMaze = useCallback((diff: MazeDifficulty) => {
        const config = MAZE_CONFIGS[diff];
        const size = config.size;

        // Create initial grid filled with walls
        const grid: LabyrinthCell[][] = [];
        for (let y = 0; y < size; y++) {
            const row: LabyrinthCell[] = [];
            for (let x = 0; x < size; x++) {
                row.push({
                    x,
                    y,
                    isWall: true,
                    isStart: false,
                    isExit: false
                });
            }
            grid.push(row);
        }

        // Carve passages using randomized DFS
        const startX = 1;
        const startY = 1;
        grid[startY][startX].isWall = false;
        grid[startY][startX].isStart = true;

        const stack: [number, number][] = [[startX, startY]];
        const directions = [
            [0, -2], // Up
            [0, 2],  // Down
            [-2, 0], // Left
            [2, 0]   // Right
        ];

        while (stack.length > 0) {
            const [cx, cy] = stack[stack.length - 1];
            // Shuffle directions
            const shuffled = [...directions].sort(() => Math.random() - 0.5);
            let carved = false;

            for (const [dx, dy] of shuffled) {
                const nx = cx + dx;
                const ny = cy + dy;

                if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && grid[ny][nx].isWall) {
                    // Carve path between (cx, cy) and (nx, ny)
                    grid[cy + dy / 2][cx + dx / 2].isWall = false;
                    grid[ny][nx].isWall = false;
                    stack.push([nx, ny]);
                    carved = true;
                    break;
                }
            }

            if (!carved) {
                stack.pop();
            }
        }

        // Braid maze slightly (remove ~8% of dead ends to provide multiple fun paths)
        for (let y = 2; y < size - 2; y += 2) {
            for (let x = 2; x < size - 2; x += 2) {
                if (grid[y][x].isWall && Math.random() < 0.09) {
                    grid[y][x].isWall = false;
                }
            }
        }

        // Exit position: bottom-right corner hallway
        const exitX = size - 2;
        const exitY = size - 2;
        grid[exitY][exitX].isWall = false;
        grid[exitY][exitX].isExit = true;

        // Collect all open walkable floor tiles excluding start & exit
        const openTiles: { x: number; y: number }[] = [];
        for (let y = 1; y < size - 1; y++) {
            for (let x = 1; x < size - 1; x++) {
                if (!grid[y][x].isWall && !(x === startX && y === startY) && !(x === exitX && y === exitY)) {
                    openTiles.push({ x, y });
                }
            }
        }

        // Shuffle open tiles for random placement of items
        openTiles.sort(() => Math.random() - 0.5);

        // Place Keys and Doors (Gates)
        let tileIndex = 0;
        for (let i = 0; i < config.keyDoorCount && tileIndex < openTiles.length - 2; i++) {
            // Place a key
            const keyTile = openTiles[tileIndex++];
            grid[keyTile.y][keyTile.x].item = 'key';

            // Place a locked gate near the exit quadrant or halfway
            const doorTile = openTiles[tileIndex++];
            grid[doorTile.y][doorTile.x].item = 'door';
            grid[doorTile.y][doorTile.x].isDoorLocked = true;
        }

        // Place Hourglasses (+20s bonus time)
        for (let i = 0; i < config.hourglassCount && tileIndex < openTiles.length; i++) {
            const hTile = openTiles[tileIndex++];
            grid[hTile.y][hTile.x].item = 'hourglass';
        }

        // Place Speed Boots
        if (tileIndex < openTiles.length) {
            const bTile = openTiles[tileIndex++];
            grid[bTile.y][bTile.x].item = 'boots';
        }

        // Place Gems
        for (let i = 0; i < config.gemCount && tileIndex < openTiles.length; i++) {
            const gTile = openTiles[tileIndex++];
            grid[gTile.y][gTile.x].item = 'gem';
        }

        // Place Gold Coins
        for (let i = 0; i < config.coinCount && tileIndex < openTiles.length; i++) {
            const cTile = openTiles[tileIndex++];
            grid[cTile.y][cTile.x].item = 'coin';
        }

        // Softlock Protection & Path Verification (BFS with key/door tracking)
        const queue: [number, number, number][] = [[startX, startY, 0]]; // [x, y, keys]
        const visited = new Set<string>([`${startX},${startY},0`]);
        let reachedExit = false;

        while (queue.length > 0) {
            const [cx, cy, ckeys] = queue.shift()!;
            if (cx === exitX && cy === exitY) {
                reachedExit = true;
                break;
            }

            const neighbors = [
                [cx, cy - 1],
                [cx, cy + 1],
                [cx - 1, cy],
                [cx + 1, cy]
            ];

            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                    const cell = grid[ny][nx];
                    if (!cell.isWall) {
                        let nextKeys = ckeys;
                        if (cell.item === 'key') {
                            nextKeys += 1;
                        }
                        if (cell.item === 'door' && cell.isDoorLocked) {
                            if (nextKeys > 0) {
                                nextKeys -= 1;
                            } else {
                                // Softlock detected at this locked door! Auto-unlock to prevent softlock.
                                cell.isDoorLocked = false;
                            }
                        }
                        const vKey = `${nx},${ny},${nextKeys}`;
                        if (!visited.has(vKey)) {
                            visited.add(vKey);
                            queue.push([nx, ny, nextKeys]);
                        }
                    }
                }
            }
        }

        // Fallback safety check: if somehow unreachable, carve direct corridor
        if (!reachedExit) {
            let cx = startX;
            let cy = startY;
            while (cx !== exitX || cy !== exitY) {
                if (cx < exitX) cx++;
                else if (cx > exitX) cx--;
                if (cy < exitY) cy++;
                else if (cy > exitY) cy--;
                grid[cy][cx].isWall = false;
                if (grid[cy][cx].isDoorLocked) {
                    grid[cy][cx].isDoorLocked = false;
                }
            }
        }

        setMazeGrid(grid);
        setStartPos({ x: startX, y: startY });
        setExitPos({ x: exitX, y: exitY });
        setPlayerPos({ x: startX, y: startY });
        setVisitedCells(new Set([`${startX},${startY}`]));
        setKeysCount(0);
        setGoldCollected(0);
        setGemsCollected(0);
        setSpeedBoostTimer(0);
        setTimeLeft(TOTAL_TIME_SECONDS);
    }, [TOTAL_TIME_SECONDS]);

    // Initialize or reset game
    const startNewGame = (diff: MazeDifficulty = difficulty) => {
        setDifficulty(diff);
        generateMaze(diff);
        setGameState('playing');
        setIsTimerRunning(true);
    };

    // Countdown Timer (Strictly 3 minutes / 180s)
    useEffect(() => {
        if (!isTimerRunning || gameState !== 'playing') {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setIsTimerRunning(false);
                    setGameState('defeat');
                    playMazeSound('lose');
                    return 0;
                }

                // Sound warnings when time is critically low
                if (prev === 31 || prev === 21 || prev === 11 || (prev <= 6 && prev > 1)) {
                    playMazeSound('warn');
                }

                return prev - 1;
            });

            // Decrement speed boost if active
            setSpeedBoostTimer(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning, gameState]);

    // Handle Player Movement with controlled step pacing
    const movePlayer = useCallback((dx: number, dy: number) => {
        if (gameState !== 'playing') return;

        const now = Date.now();
        const minStepDelay = speedBoostTimer > 0 ? 80 : 120;
        if (now - lastMoveTimeRef.current < minStepDelay) return;
        lastMoveTimeRef.current = now;

        const newX = playerPos.x + dx;
        const newY = playerPos.y + dy;

        // Facing direction
        if (dx > 0) setPlayerFacing('right');
        else if (dx < 0) setPlayerFacing('left');
        else if (dy > 0) setPlayerFacing('down');
        else if (dy < 0) setPlayerFacing('up');

        // Bounds check
        if (newY < 0 || newY >= mazeGrid.length || newX < 0 || newX >= mazeGrid[0].length) {
            return;
        }

        const targetCell = mazeGrid[newY][newX];

        // Wall check
        if (targetCell.isWall) {
            return;
        }

        // Locked Door Check
        if (targetCell.item === 'door' && targetCell.isDoorLocked) {
            if (keysCount > 0) {
                // Unlock door!
                setKeysCount(k => k - 1);
                targetCell.isDoorLocked = false;
                targetCell.item = undefined;
                playMazeSound('door');
                addFloatingNotice('🔓 Залізні ворота відчинено ключем!', 'text-emerald-400');
            } else {
                playMazeSound('warn');
                addFloatingNotice('🔒 Ворота замкнені! Знайдіть ключ 🗝️', 'text-amber-400');
                return;
            }
        }

        // Play step sound
        playMazeSound('step');

        // Move player
        setPlayerPos({ x: newX, y: newY });
        setVisitedCells(prev => new Set(prev).add(`${newX},${newY}`));

        // Item Collection
        if (targetCell.item) {
            if (targetCell.item === 'coin') {
                const coinAmount = Math.floor(Math.random() * 20) + 15;
                setGoldCollected(g => g + coinAmount);
                playMazeSound('coin');
                addFloatingNotice(`+${coinAmount} 💰 Золота!`, 'text-yellow-300');
                targetCell.item = undefined;
            } else if (targetCell.item === 'gem') {
                setGemsCollected(gems => gems + 1);
                const gemGold = 50;
                setGoldCollected(g => g + gemGold);
                playMazeSound('key');
                addFloatingNotice(`+1 💎 Дорогоцінний Сапфір (+${gemGold} 💰)!`, 'text-cyan-300');
                targetCell.item = undefined;
            } else if (targetCell.item === 'key') {
                setKeysCount(k => k + 1);
                playMazeSound('key');
                addFloatingNotice(`+1 🗝️ Старовинний Ключ знайдено!`, 'text-amber-300');
                targetCell.item = undefined;
            } else if (targetCell.item === 'hourglass') {
                const bonusSeconds = 25;
                setTimeLeft(t => Math.min(TOTAL_TIME_SECONDS, t + bonusSeconds));
                playMazeSound('time');
                addFloatingNotice(`+${bonusSeconds} сек ⏳ Пісочний годинник часу!`, 'text-emerald-300');
                targetCell.item = undefined;
            } else if (targetCell.item === 'boots') {
                setSpeedBoostTimer(15);
                playMazeSound('boots');
                addFloatingNotice('👟 Чоботи Гермеса: стрімкий крок!', 'text-amber-400');
                targetCell.item = undefined;
            }
        }

        // Exit Check (Victory!)
        if (targetCell.isExit) {
            setIsTimerRunning(false);
            setGameState('victory');
            playMazeSound('win');
        }
    }, [gameState, playerPos, mazeGrid, keysCount, TOTAL_TIME_SECONDS, speedBoostTimer]);

    // Keyboard listener (Arrow keys & WASD)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return;

            let handled = false;
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                case 'ц':
                case 'Ц':
                    movePlayer(0, -1);
                    handled = true;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                case 'і':
                case 'І':
                case 'ы':
                case 'Ы':
                    movePlayer(0, 1);
                    handled = true;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                case 'ф':
                case 'Ф':
                    movePlayer(-1, 0);
                    handled = true;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                case 'в':
                case 'В':
                    movePlayer(1, 0);
                    handled = true;
                    break;
            }

            if (handled) {
                e.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, movePlayer]);

    // Top-Down Canvas Rendering (Вид зверху)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || mazeGrid.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = mazeGrid.length;
        const tileSize = Math.floor(canvas.width / size);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Torchlight radius around player
        const torchRadius = speedBoostTimer > 0 ? 5.5 : 4.5;

        // Render labyrinth cells
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const cell = mazeGrid[y][x];
                const px = x * tileSize;
                const py = y * tileSize;

                const distToPlayer = Math.hypot(x - playerPos.x, y - playerPos.y);
                const isVisited = visitedCells.has(`${x},${y}`);
                const inLight = distToPlayer <= torchRadius;

                // Fog of War check
                if (fogOfWar && !inLight && !isVisited) {
                    // Hidden pitch black in fog of war
                    ctx.fillStyle = '#0a0908';
                    ctx.fillRect(px, py, tileSize, tileSize);
                    continue;
                }

                if (cell.isWall) {
                    // Medieval castle stone wall (3D Top-Down View)
                    ctx.fillStyle = '#1e1814';
                    ctx.fillRect(px, py, tileSize, tileSize);

                    // Stone brick pattern and bevel
                    ctx.strokeStyle = '#2d241e';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1);

                    // Inner wall highlight
                    ctx.fillStyle = '#3a2e26';
                    ctx.fillRect(px + 1, py + 1, tileSize - 2, 2);
                    ctx.fillRect(px + 1, py + 1, 2, tileSize - 2);

                    // Dark cast shadow at bottom and right
                    ctx.fillStyle = '#0f0c0a';
                    ctx.fillRect(px + 1, py + tileSize - 3, tileSize - 2, 2);
                    ctx.fillRect(px + tileSize - 3, py + 1, 2, tileSize - 2);

                    // Subtle stone texture cracks
                    if ((x + y) % 3 === 0) {
                        ctx.fillStyle = '#4a3b30';
                        ctx.fillRect(px + tileSize * 0.3, py + tileSize * 0.4, tileSize * 0.4, 1);
                    }
                } else {
                    // Medieval floor tile
                    ctx.fillStyle = (x + y) % 2 === 0 ? '#2a221b' : '#332921';
                    ctx.fillRect(px, py, tileSize, tileSize);

                    // Tile borders
                    ctx.strokeStyle = '#1b1511';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(px, py, tileSize, tileSize);

                    // Start cell
                    if (cell.isStart) {
                        ctx.fillStyle = '#1e3a2f';
                        ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
                        ctx.strokeStyle = '#10b981';
                        ctx.lineWidth = 1.5;
                        ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

                        // Entrance banner symbol
                        ctx.font = `${Math.floor(tileSize * 0.55)}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('🪜', px + tileSize / 2, py + tileSize / 2);
                    }

                    // Exit portal / Golden stairs
                    if (cell.isExit) {
                        ctx.fillStyle = '#422800';
                        ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
                        ctx.strokeStyle = '#f59e0b';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);

                        // Pulsating golden radiance glow
                        const pulse = (Math.sin(Date.now() / 250) + 1) / 2;
                        ctx.fillStyle = `rgba(245, 158, 11, ${0.3 + pulse * 0.4})`;
                        ctx.beginPath();
                        ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.45, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.font = `${Math.floor(tileSize * 0.6)}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('🏆', px + tileSize / 2, py + tileSize / 2);
                    }

                    // Breadcrumb Trail / Ariadne's Thread (Нитка Аріадни)
                    if (showBreadcrumbs && isVisited && !cell.isStart && !cell.isExit) {
                        ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
                        ctx.beginPath();
                        ctx.arc(px + tileSize / 2, py + tileSize / 2, Math.max(2, tileSize * 0.12), 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // Items on cell
                    if (cell.item) {
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        const itemSize = Math.floor(tileSize * 0.58);
                        ctx.font = `${itemSize}px sans-serif`;

                        if (cell.item === 'coin') {
                            ctx.fillText('💰', px + tileSize / 2, py + tileSize / 2);
                        } else if (cell.item === 'gem') {
                            ctx.fillText('💎', px + tileSize / 2, py + tileSize / 2);
                        } else if (cell.item === 'key') {
                            ctx.fillText('🗝️', px + tileSize / 2, py + tileSize / 2);
                        } else if (cell.item === 'hourglass') {
                            ctx.fillText('⏳', px + tileSize / 2, py + tileSize / 2);
                        } else if (cell.item === 'boots') {
                            ctx.fillText('👟', px + tileSize / 2, py + tileSize / 2);
                        } else if (cell.item === 'door') {
                            // Locked portcullis gate
                            ctx.fillStyle = 'rgba(120, 53, 15, 0.7)';
                            ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
                            ctx.strokeStyle = '#f59e0b';
                            ctx.lineWidth = 1.5;
                            ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
                            ctx.fillText('🔒', px + tileSize / 2, py + tileSize / 2);
                        }
                    }
                }

                // Fog of War Dimming for explored tiles outside current torchlight
                if (fogOfWar && !inLight && isVisited) {
                    ctx.fillStyle = 'rgba(10, 8, 6, 0.7)';
                    ctx.fillRect(px, py, tileSize, tileSize);
                }
            }
        }

        // Render Player Avatar (Top-Down with Lantern Aura)
        const playerPx = playerPos.x * tileSize + tileSize / 2;
        const playerPy = playerPos.y * tileSize + tileSize / 2;

        // Warm torchlight glow circle onto floor
        const glowGrad = ctx.createRadialGradient(
            playerPx, playerPy, tileSize * 0.3,
            playerPx, playerPy, tileSize * torchRadius
        );
        glowGrad.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
        glowGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.10)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(playerPx, playerPy, tileSize * torchRadius, 0, Math.PI * 2);
        ctx.fill();

        // Player Token Ring
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(playerPx, playerPy, tileSize * 0.42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = speedBoostTimer > 0 ? '#38bdf8' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(playerPx, playerPy, tileSize * 0.36, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Player Icon / Avatar
        ctx.font = `${Math.floor(tileSize * 0.52)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(speedBoostTimer > 0 ? '⚡' : '🧙‍♂️', playerPx, playerPy);

        // Direction pointer arrow
        let angle = 0;
        if (playerFacing === 'right') angle = 0;
        else if (playerFacing === 'down') angle = Math.PI / 2;
        else if (playerFacing === 'left') angle = Math.PI;
        else if (playerFacing === 'up') angle = -Math.PI / 2;

        ctx.save();
        ctx.translate(playerPx, playerPy);
        ctx.rotate(angle);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(tileSize * 0.44, 0);
        ctx.lineTo(tileSize * 0.28, -tileSize * 0.14);
        ctx.lineTo(tileSize * 0.28, tileSize * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

    }, [mazeGrid, playerPos, playerFacing, visitedCells, fogOfWar, showBreadcrumbs, speedBoostTimer]);

    // Format time MM:SS
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate time percentage for progress bar
    const timePercent = (timeLeft / TOTAL_TIME_SECONDS) * 100;

    // Victory calculations
    const timeUsed = TOTAL_TIME_SECONDS - timeLeft;
    const timeBonusGold = Math.floor(timeLeft * 1.5);
    const totalPrizeGold = goldCollected + timeBonusGold + (difficulty === 'hard' ? 80 : difficulty === 'normal' ? 50 : 25);
    const rankGrade = timeUsed <= 75 ? 'S' : timeUsed <= 135 ? 'A' : 'B';

    // Click on canvas to move in that direction or adjacent cell
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (gameState !== 'playing') return;
        const canvas = canvasRef.current;
        if (!canvas || mazeGrid.length === 0) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const tileSize = canvas.width / mazeGrid.length;
        const targetTileX = Math.floor(clickX / tileSize);
        const targetTileY = Math.floor(clickY / tileSize);

        const dx = targetTileX - playerPos.x;
        const dy = targetTileY - playerPos.y;

        // If clicking adjacent cell, step there
        if (Math.abs(dx) + Math.abs(dy) === 1) {
            movePlayer(dx, dy);
        } else if (Math.abs(dx) > Math.abs(dy)) {
            // Move horizontally toward target
            movePlayer(dx > 0 ? 1 : -1, 0);
        } else if (Math.abs(dy) > 0) {
            // Move vertically toward target
            movePlayer(0, dy > 0 ? 1 : -1);
        }
    };

    // Auto-start game on open if not already initialized
    useEffect(() => {
        if (isOpen && gameState === 'intro') {
            startNewGame('normal');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none">
            <motion.div 
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="relative w-full max-w-4xl max-h-[96vh] flex flex-col bg-[#14100c] border-2 border-[#b8860b] rounded-2xl shadow-2xl overflow-hidden text-stone-200"
            >
                {/* Header Toolbar */}
                <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 bg-gradient-to-r from-[#221912] via-[#2d2218] to-[#221912] border-b border-[#b8860b]/40">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-lg shadow-inner">
                            🧭
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-black font-serif text-[#f5ebd7] tracking-wide">
                                    Лабіринт Підвалів (Вид Зверху)
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    {MAZE_CONFIGS[difficulty].name}
                                </span>
                            </div>
                            <div className="text-[11px] text-stone-400">
                                {tavernName} {opponent ? `• Випробування від: ${opponent.name}` : '• Шинкарське парі на 3 хвилини'}
                            </div>
                        </div>
                    </div>

                    {/* Top Right Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Audio toggle */}
                        <button
                            onClick={() => setSoundEnabled(s => !s)}
                            className="p-1.5 sm:p-2 rounded-lg bg-stone-900/80 border border-stone-700 hover:border-amber-500/50 text-stone-300 hover:text-amber-300 transition-colors"
                            title={soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
                        >
                            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                        </button>

                        {/* Rules modal button */}
                        <button
                            onClick={() => setShowRules(r => !r)}
                            className="p-1.5 sm:p-2 rounded-lg bg-stone-900/80 border border-stone-700 hover:border-amber-500/50 text-stone-300 hover:text-amber-300 transition-colors"
                            title="Правила лабіринту"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 rounded-lg bg-red-950/60 border border-red-700/60 hover:bg-red-900/80 text-red-300 transition-colors"
                            title="Покинути лабіринт"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 3-Minute Timer HUD Banner */}
                <div className="px-3 sm:px-5 py-2 bg-[#19130d] border-b border-[#b8860b]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Time Counter */}
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-black text-sm sm:text-base border ${
                            timeLeft <= 30
                                ? 'bg-red-950/80 text-red-400 border-red-500 animate-pulse ring-2 ring-red-500/50'
                                : timeLeft <= 60
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/80'
                                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                        }`}>
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(timeLeft)}</span>
                            <span className="text-[10px] font-sans font-normal opacity-80">(з 03:00)</span>
                        </div>

                        {/* Time Bar */}
                        <div className="hidden sm:block w-32 md:w-44 h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-700">
                            <div 
                                className={`h-full transition-all duration-300 ${
                                    timeLeft <= 30 ? 'bg-red-500' : timeLeft <= 60 ? 'bg-amber-400' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${timePercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Inventory & Status */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        {/* Keys */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800" title="Знайдені ключі для залізних воріт">
                            <Key className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-bold text-amber-200">{keysCount}</span>
                        </div>

                        {/* Gold */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800" title="Зібране золото">
                            <Coins className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="font-bold text-yellow-300">+{goldCollected}</span>
                        </div>

                        {/* Gems */}
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800" title="Знайдені сапфіри">
                            <span className="text-xs">💎</span>
                            <span className="font-bold text-cyan-300">{gemsCollected}</span>
                        </div>

                        {/* Speed Boost Indicator */}
                        {speedBoostTimer > 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-950 border border-sky-400 text-sky-300 text-[11px] animate-pulse">
                                <Zap className="w-3 h-3 text-sky-400" />
                                <span>Швидкість ({speedBoostTimer}с)</span>
                            </div>
                        )}
                    </div>

                    {/* View Controls & Breadcrumb Toggles */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setFogOfWar(f => !f)}
                            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-colors ${
                                fogOfWar
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                                    : 'bg-stone-900 text-stone-300 border-stone-700 hover:text-amber-200'
                            }`}
                            title="Перемкнути огляд: весь лабіринт чи атмосферний туман факела"
                        >
                            {fogOfWar ? <Flame className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                            <span className="hidden md:inline">{fogOfWar ? 'Туман' : 'Огляд карти'}</span>
                        </button>

                        <button
                            onClick={() => setShowBreadcrumbs(b => !b)}
                            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 border transition-colors ${
                                showBreadcrumbs
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                                    : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-amber-200'
                            }`}
                            title="Нитка Аріадни: підсвічує пройдений шлях золотими слідами"
                        >
                            <Footprints className="w-3 h-3" />
                            <span className="hidden md:inline">Сліди</span>
                        </button>

                        {/* Reset / New Maze */}
                        <button
                            onClick={() => startNewGame(difficulty)}
                            className="px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700"
                            title="Перезапустити лабіринт"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span className="hidden md:inline">Заново</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="relative flex-1 flex flex-col md:flex-row items-center justify-center p-2 sm:p-4 gap-3 overflow-hidden bg-[#0e0b08]">
                    {/* Canvas Map Container */}
                    <div className="relative flex items-center justify-center border-2 border-stone-800 rounded-xl overflow-hidden bg-stone-950 shadow-2xl max-w-[540px] max-h-[540px] aspect-square w-full">
                        <canvas
                            ref={canvasRef}
                            width={540}
                            height={540}
                            onClick={handleCanvasClick}
                            className="w-full h-full object-contain cursor-pointer"
                        />

                        {/* Floating Notifications */}
                        <div className="absolute top-3 left-3 right-3 pointer-events-none flex flex-col gap-1 items-center">
                            <AnimatePresence>
                                {floatText.map(msg => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -15, scale: 0.9 }}
                                        className={`px-3 py-1 rounded-full text-xs font-black bg-stone-950/90 border border-amber-500/60 shadow-lg ${msg.color}`}
                                    >
                                        {msg.text}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Distance to Exit Compass HUD */}
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-stone-950/80 border border-stone-800 text-[10px] text-amber-200/90 font-mono flex items-center gap-1.5 backdrop-blur-sm">
                            <Compass className="w-3.5 h-3.5 text-amber-400" />
                            <span>До виходу 🏆: ~{Math.abs(exitPos.x - playerPos.x) + Math.abs(exitPos.y - playerPos.y)} кроків</span>
                        </div>
                    </div>

                    {/* Right Panel: Controls, Difficulty, Tips */}
                    <div className="w-full md:w-64 flex flex-col justify-between gap-3 shrink-0">
                        {/* Difficulty Selector */}
                        <div className="bg-[#1b1510] p-3 rounded-xl border border-stone-800/80 space-y-2">
                            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                                <span>Складність:</span>
                                <span className="text-[10px] text-stone-400">Час: 3 хвилини</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                {(['easy', 'normal', 'hard'] as MazeDifficulty[]).map(d => (
                                    <button
                                        key={d}
                                        onClick={() => {
                                            if (gameState === 'playing' && difficulty !== d) {
                                                if (window.confirm('Почати новий лабіринт з іншою складністю?')) {
                                                    startNewGame(d);
                                                }
                                            } else {
                                                startNewGame(d);
                                            }
                                        }}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                            difficulty === d
                                                ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-md font-black'
                                                : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300 border-stone-700'
                                        }`}
                                    >
                                        {d === 'easy' ? '15x15' : d === 'normal' ? '21x21' : '27x27'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="bg-[#1b1510] p-3 rounded-xl border border-stone-800/80 space-y-1.5 text-[11px]">
                            <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">Орієнтири:</div>
                            <div className="grid grid-cols-2 gap-1 text-stone-300">
                                <div className="flex items-center gap-1.5"><span>🪜</span> <span>Вхід (старт)</span></div>
                                <div className="flex items-center gap-1.5"><span>🏆</span> <span>Вихід (мета)</span></div>
                                <div className="flex items-center gap-1.5"><span>🗝️</span> <span>Ключ від воріт</span></div>
                                <div className="flex items-center gap-1.5"><span>🔒</span> <span>Залізні ворота</span></div>
                                <div className="flex items-center gap-1.5"><span>⏳</span> <span>+25 сек часу</span></div>
                                <div className="flex items-center gap-1.5"><span>💰</span> <span>Золоті монети</span></div>
                            </div>
                        </div>

                        {/* On-Screen Touch / Mouse D-Pad */}
                        <div className="bg-[#1b1510] p-2.5 rounded-xl border border-stone-800/80 flex flex-col items-center">
                            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                                Керування (WASD або стрілки):
                            </div>
                            <div className="grid grid-cols-3 gap-1 w-36">
                                <div />
                                <button
                                    onClick={() => movePlayer(0, -1)}
                                    className="p-2.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-stone-200 hover:text-stone-950 border border-stone-700 active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer"
                                    title="Вгору"
                                >
                                    <ChevronUp className="w-5 h-5" />
                                </button>
                                <div />

                                <button
                                    onClick={() => movePlayer(-1, 0)}
                                    className="p-2.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-stone-200 hover:text-stone-950 border border-stone-700 active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer"
                                    title="Вліво"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => movePlayer(0, 1)}
                                    className="p-2.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-stone-200 hover:text-stone-950 border border-stone-700 active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer"
                                    title="Вниз"
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => movePlayer(1, 0)}
                                    className="p-2.5 rounded-xl bg-stone-900 hover:bg-amber-600 text-stone-200 hover:text-stone-950 border border-stone-700 active:scale-95 transition-all flex items-center justify-center shadow-md cursor-pointer"
                                    title="Вправо"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Victory Modal Overlay */}
                <AnimatePresence>
                    {gameState === 'victory' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.85, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="w-full max-w-md bg-gradient-to-b from-[#2a1d12] to-[#16100a] border-2 border-amber-400 rounded-2xl p-6 text-center shadow-2xl space-y-4"
                            >
                                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-inner animate-bounce">
                                    🏆
                                </div>

                                <div>
                                    <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                        РАНГ: {rankGrade}
                                    </span>
                                    <h3 className="text-2xl font-black font-serif text-[#f5ebd7] mt-1">
                                        Лабіринт Успішно Пройдено!
                                    </h3>
                                    <p className="text-xs text-amber-200/90 mt-1">
                                        Ви знайшли вихід з підземелля швидше за виділений ліміт у 3 хвилини!
                                    </p>
                                </div>

                                {/* Results Grid */}
                                <div className="grid grid-cols-2 gap-2 bg-[#120d09] p-3 rounded-xl border border-stone-800 text-xs">
                                    <div className="p-2 rounded-lg bg-stone-900/60">
                                        <div className="text-stone-400 text-[10px]">Витрачений час:</div>
                                        <div className="text-amber-300 font-mono font-bold text-sm">
                                            {formatTime(timeUsed)}
                                        </div>
                                    </div>

                                    <div className="p-2 rounded-lg bg-stone-900/60">
                                        <div className="text-stone-400 text-[10px]">Залишок часу:</div>
                                        <div className="text-emerald-400 font-mono font-bold text-sm">
                                            +{timeLeft} сек
                                        </div>
                                    </div>

                                    <div className="p-2 rounded-lg bg-stone-900/60">
                                        <div className="text-stone-400 text-[10px]">Зібрано монет:</div>
                                        <div className="text-yellow-300 font-mono font-bold text-sm">
                                            +{goldCollected} 💰
                                        </div>
                                    </div>

                                    <div className="p-2 rounded-lg bg-stone-900/60">
                                        <div className="text-stone-400 text-[10px]">Бонус за швидкість:</div>
                                        <div className="text-yellow-400 font-mono font-bold text-sm">
                                            +{timeBonusGold} 💰
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl">
                                    <div className="text-xs text-amber-200">Загальна нагорода:</div>
                                    <div className="text-xl font-black text-yellow-300 flex items-center justify-center gap-2 mt-0.5">
                                        <Coins className="w-5 h-5 text-yellow-400" />
                                        <span>+{totalPrizeGold} Золотих Монет</span>
                                        <span className="text-xs font-normal text-amber-300/80">(+{expectedXpReward} XP)</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => startNewGame(difficulty)}
                                        className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
                                    >
                                        Пройти ще раз
                                    </button>

                                    <button
                                        onClick={() => onVictory(totalPrizeGold)}
                                        className="flex-1 py-2.5 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 text-stone-950 shadow-lg border border-yellow-300 transition-transform hover:scale-[1.02] active:scale-95"
                                    >
                                        Забрати нагороду 👑
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Defeat / Timeout Modal Overlay */}
                <AnimatePresence>
                    {gameState === 'defeat' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.85, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="w-full max-w-md bg-gradient-to-b from-[#241313] to-[#140b0b] border-2 border-red-500 rounded-2xl p-6 text-center shadow-2xl space-y-4"
                            >
                                <div className="w-16 h-16 mx-auto rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center text-3xl shadow-inner animate-pulse">
                                    ⏳
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black font-serif text-red-400">
                                        Час Вичерпано! (00:00)
                                    </h3>
                                    <p className="text-xs text-stone-300 mt-1">
                                        3 хвилини спливли! Кам'яні ворота тавернного підземелля із гуркотом зачинилися...
                                    </p>
                                </div>

                                <div className="bg-[#120a0a] p-3 rounded-xl border border-red-950/80 text-xs text-stone-300 space-y-1">
                                    <div>Ви не встигли знайти вихід за відведений час.</div>
                                    <div className="text-stone-400 text-[11px]">
                                        Зібрано золота: {goldCollected} 💰 • Досліджено клітинок: {visitedCells.size}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => onDefeat()}
                                        className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 transition-colors"
                                    >
                                        Повернутися в таверну
                                    </button>

                                    <button
                                        onClick={() => startNewGame(difficulty)}
                                        className="flex-1 py-2.5 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-red-700 via-rose-600 to-red-600 hover:from-red-600 text-white shadow-lg border border-red-400 transition-transform hover:scale-[1.02] active:scale-95"
                                    >
                                        Спробувати знову 🔄
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Rules Dialog */}
                <AnimatePresence>
                    {showRules && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowRules(false)}
                        >
                            <div 
                                className="w-full max-w-md bg-[#1d1610] border-2 border-amber-500/80 rounded-2xl p-5 text-stone-200 shadow-2xl space-y-3"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                                    <h4 className="font-serif font-black text-base text-amber-300 flex items-center gap-2">
                                        <span>📜</span> Правила Підземного Лабіринту
                                    </h4>
                                    <button onClick={() => setShowRules(false)} className="text-stone-400 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2 text-xs text-stone-300">
                                    <p>
                                        <strong className="text-amber-300">Мета гри:</strong> пройти лабіринт від сходів входу (🪜) до кубка-виходу (🏆) за відведений час <strong>3 хвилини (180 секунд)</strong>.
                                    </p>
                                    <p>
                                        <strong className="text-amber-300">Керування:</strong> стрілки на клавіатурі (↑ ↓ ← →), клавіші <strong>WASD</strong>, екранні кнопки джойстика або клік мишкою по клітинках.
                                    </p>
                                    <p>
                                        <strong className="text-amber-300">Предмети в лабіринті:</strong>
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1 text-stone-400">
                                        <li><strong>🗝️ Ключі та 🔒 Ворота:</strong> збирайте ключі у глухих кутах, аби відчиняти замкнені ворота до швидких шляхів!</li>
                                        <li><strong>⏳ Годинник:</strong> додає +25 додаткових секунд до таймера.</li>
                                        <li><strong>👟 Чоботи:</strong> надають прискорення та розширюють радіус факела.</li>
                                        <li><strong>💰 Монети та 💎 Сапфіри:</strong> додаткове золото та досвід при перемозі!</li>
                                        <li><strong>Нитка Аріадни:</strong> залишає золоті сліди, аби ви не заблукали у власних коридорах.</li>
                                    </ul>
                                </div>

                                <button
                                    onClick={() => setShowRules(false)}
                                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs"
                                >
                                    Зрозуміло, до гри!
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

import { useState, useRef, useEffect, useCallback, useMemo, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SettlementData, WorldProgress, WorldPlayerPosition } from '../types';
import { WORLD_SETTLEMENTS, saveWorldProgress } from '../lib/worldData';
import { LAND_REGIONS } from '../lib/settlements/proceduralWorld';
import worldMapImg from '../assets/images/clean_world_map_1789426428380.jpg';
import { 
    isPointOnLand, 
    getTerrainInfo, 
    ensureOnLand, 
    LAND_CONTINENTS, 
    WATER_BODIES 
} from '../lib/world/terrainSystem';
import { 
    Compass, 
    Navigation, 
    Coins, 
    Trophy, 
    Search, 
    ZoomIn, 
    ZoomOut, 
    Beer, 
    CheckCircle2, 
    ChevronRight,
    Crosshair,
    Zap,
    MapPin,
    Filter,
    Sparkles,
    Skull,
    Landmark,
    X,
    Footprints,
    Shield,
    Home,
    Crown,
    Map as MapIcon,
    ArrowRight,
    ExternalLink,
    Swords,
    ChevronDown,
    Building2,
    TreePine,
    Waves,
    Info,
    ShieldCheck,
    AlertOctagon,
    Dices,
    Heart,
    BookOpen,
    Target,
    Scroll,
    Star
} from 'lucide-react';
import { PlayerMapToken } from './PlayerMapToken';
import { WanderingGamblerMapToken } from './WanderingGamblerMapToken';
import { MonsterSquadMapToken } from './MonsterSquadMapToken';
import { CaravanMapToken } from './CaravanMapToken';
import { CaravanDetailsModal } from './CaravanDetailsModal';
import { ClassGuidebookModal } from './ClassGuidebookModal';
import { MonsterSquad, generateInitialWanderingSquads, updateWanderingSquads } from '../lib/monsters/wanderingMonsters';
import { calculateTotalHealth } from '../lib/brawlEngine';
import { WanderingGambler, generateInitialWanderingGamblers, updateWanderingGamblers } from '../lib/wanderingGamblers';
import { TradeCaravan, Quest, QuestObjective } from '../types';
import { generateInitialWorldCaravans, updateWorldCaravans, collectCaravanPayout } from '../lib/tradeCaravans';

interface WorldMapViewProps {
    progress: WorldProgress;
    onUpdateProgress: (newProgress: WorldProgress) => void;
    onEnterSettlement: (settlement: SettlementData) => void;
    onStartQuickPlay?: () => void;
    onOpenCharacterModal?: () => void;
    onOpenQuestModal?: () => void;
    wanderingSquads?: MonsterSquad[];
    onUpdateSquads?: (squads: MonsterSquad[]) => void;
    onMonsterEncounter?: (squad: MonsterSquad) => void;
    wanderingGamblers?: WanderingGambler[];
    onUpdateGamblers?: (gamblers: WanderingGambler[]) => void;
    onGamblerEncounter?: (gambler: WanderingGambler) => void;
    isEncounterActive?: boolean;
    activeCaravans?: TradeCaravan[];
    onUpdateCaravans?: (caravans: TradeCaravan[]) => void;
}

type SettlementFilterType = 'all' | 'city' | 'castle' | 'village' | 'hamlet' | 'graveyard' | 'ruins';

// Ultra-Optimized 4K Canvas Dimension (3840x2160 • 16:9 Aspect Ratio)
// Prevents GPU memory overflow (under 8192px texture threshold) while providing vast cinematic scale
const BASE_MAP_WIDTH = 3840;
const BASE_MAP_HEIGHT = 2160;

export function WorldMapView({
    progress,
    onUpdateProgress,
    onEnterSettlement,
    onStartQuickPlay,
    onOpenCharacterModal,
    onOpenQuestModal,
    wanderingSquads,
    onUpdateSquads,
    onMonsterEncounter,
    wanderingGamblers,
    onUpdateGamblers,
    onGamblerEncounter,
    isEncounterActive,
    activeCaravans,
    onUpdateCaravans
}: WorldMapViewProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    
    // Balanced smooth default zoom: 0.75x (2880x1620, optimal 60fps performance)
    const [zoom, setZoom] = useState<number>(0.75);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<SettlementFilterType>('all');
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [selectedSettlement, setSelectedSettlement] = useState<SettlementData | null>(null);
    const [targetMarker, setTargetMarker] = useState<{ x: number; y: number } | null>(null);
    const [showMinimap, setShowMinimap] = useState<boolean>(true);
    const [showInspectorPanel, setShowInspectorPanel] = useState<boolean>(true);
    const [showTerrainControl, setShowTerrainControl] = useState<boolean>(false);
    const [hoverTerrain, setHoverTerrain] = useState<{ x: number; y: number; isLand: boolean; regionName: string; zoneName: string } | null>(null);
    const [waterWarning, setWaterWarning] = useState<string | null>(null);
    const [isQuestHudMinimized, setIsQuestHudMinimized] = useState<boolean>(false);

    // Active quests & objectives calculation
    const activeQuestObjectives = useMemo(() => {
        const list: { quest: Quest; objective: QuestObjective }[] = [];
        (progress.activeQuests || []).forEach(q => {
            if (q.status === 'active') {
                const objs = (q.objectives && q.objectives.length > 0)
                    ? q.objectives
                    : [{
                        id: `${q.id}_main`,
                        text: q.title,
                        type: 'custom' as const,
                        currentCount: q.currentCount || 0,
                        requiredCount: q.requiredCount || 1,
                        isCompleted: false,
                        targetSettlementId: q.target?.settlementId,
                        targetCoords: q.target?.targetCoords
                    }];
                objs.forEach(obj => {
                    if (!obj.isCompleted) {
                        list.push({ quest: q, objective: obj });
                    }
                });
            }
        });
        return list;
    }, [progress.activeQuests]);

    const focusedQuestObjective = useMemo(() => {
        if (activeQuestObjectives.length === 0) return null;
        if (progress.trackedQuestId) {
            const found = activeQuestObjectives.find(item => 
                item.quest.id === progress.trackedQuestId && 
                (!progress.trackedObjectiveId || item.objective.id === progress.trackedObjectiveId)
            );
            if (found) return found;
        }
        return activeQuestObjectives[0];
    }, [activeQuestObjectives, progress.trackedQuestId, progress.trackedObjectiveId]);

    // Wandering Monster Squads State
    const squadsRef = useRef<MonsterSquad[]>(wanderingSquads || generateInitialWanderingSquads());
    const [localSquads, setLocalSquads] = useState<MonsterSquad[]>(() => squadsRef.current);
    const [chasingSquadNotice, setChasingSquadNotice] = useState<MonsterSquad | null>(null);
    const [showMonstersPanel, setShowMonstersPanel] = useState<boolean>(false);
    const [showMonsterTrails, setShowMonsterTrails] = useState<boolean>(true);
    const [selectedMonsterSquad, setSelectedMonsterSquad] = useState<MonsterSquad | null>(null);
    const lastEncounterTimeRef = useRef<number>(0);

    // Wandering Gamblers State
    const gamblersRef = useRef<WanderingGambler[]>(wanderingGamblers || generateInitialWanderingGamblers());
    const [localGamblers, setLocalGamblers] = useState<WanderingGambler[]>(() => gamblersRef.current);
    const [showGamblersPanel, setShowGamblersPanel] = useState<boolean>(false);
    const [showGamblerTrails, setShowGamblerTrails] = useState<boolean>(true);
    const [selectedGambler, setSelectedGambler] = useState<WanderingGambler | null>(null);
    const [gamblerCategoryFilter, setGamblerCategoryFilter] = useState<'all' | 'cards' | 'board' | 'dice' | 'tourney' | 'martial'>('all');
    const lastGamblerEncounterTimeRef = useRef<number>(0);

    // Trade Caravans State
    const initialCaravans = useMemo(() => {
        if (activeCaravans && activeCaravans.length > 0) return activeCaravans;
        if (progress.activeCaravans && progress.activeCaravans.length > 0) return progress.activeCaravans;
        return generateInitialWorldCaravans();
    }, [activeCaravans, progress.activeCaravans]);

    const caravansRef = useRef<TradeCaravan[]>(initialCaravans);
    const [localCaravans, setLocalCaravans] = useState<TradeCaravan[]>(() => caravansRef.current);
    const [selectedCaravan, setSelectedCaravan] = useState<TradeCaravan | null>(null);
    const [caravanCombatNotice, setCaravanCombatNotice] = useState<string | null>(null);
    const caravanCombatTimerRef = useRef<NodeJS.Timeout | null>(null);
    const waterWarningTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [showClassGuideModal, setShowClassGuideModal] = useState<boolean>(false);

    // Sync when external squads change
    useEffect(() => {
        if (wanderingSquads) {
            squadsRef.current = wanderingSquads;
            setLocalSquads(wanderingSquads);
        }
    }, [wanderingSquads]);

    // Sync when external gamblers change
    useEffect(() => {
        if (wanderingGamblers) {
            gamblersRef.current = wanderingGamblers;
            setLocalGamblers(wanderingGamblers);
        }
    }, [wanderingGamblers]);

    // Sync when external caravans change
    useEffect(() => {
        if (activeCaravans) {
            caravansRef.current = activeCaravans;
            setLocalCaravans(activeCaravans);
        } else if (progress.activeCaravans) {
            // Keep in sync with progress.activeCaravans if new ones are added
            const existingMap = new Map(caravansRef.current.map(c => [c.id, c]));
            const merged = progress.activeCaravans.map(c => existingMap.get(c.id) || c);
            caravansRef.current = merged;
            setLocalCaravans(merged);
        }
    }, [activeCaravans, progress.activeCaravans]);

    // Mouse drag panning state
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
    const hasDraggedRef = useRef(false);

    // Player position animation
    const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>(() => progress.playerPosition);
    const playerPosRef = useRef<{ x: number; y: number }>(progress.playerPosition);
    const [isPlayerMoving, setIsPlayerMoving] = useState<boolean>(false);
    const [playerFacing, setPlayerFacing] = useState<'left' | 'right'>('right');
    const animFrameRef = useRef<number | null>(null);
    const isMovingRef = useRef<boolean>(false);

    // Keep player position synced with progress on initial mount
    useEffect(() => {
        if (!isMovingRef.current) {
            setPlayerPos({ x: progress.playerPosition.x, y: progress.playerPosition.y });
            playerPosRef.current = { x: progress.playerPosition.x, y: progress.playerPosition.y };
        }
    }, [progress.playerPosition.x, progress.playerPosition.y]);

    // Wandering monster & gambler movement loop (Time completely freezes when encounter is active)
    useEffect(() => {
        // If an encounter or modal game is active, do not run background interval at all!
        if (isEncounterActive) {
            return;
        }

        let lastTime = performance.now();
        const intervalId = setInterval(() => {
            const now = performance.now();
            const dt = Math.min(0.5, (now - lastTime) / 1000);
            lastTime = now;

            const curPlayerPos = playerPosRef.current;

            const { updatedSquads, collidedSquad, chasingSquad } = updateWanderingSquads(
                squadsRef.current,
                dt,
                curPlayerPos,
                false
            );

            squadsRef.current = updatedSquads;
            setLocalSquads(updatedSquads);
            setChasingSquadNotice(chasingSquad || null);

            // Update wandering gamblers
            const { updatedGamblers, encounteredGambler } = updateWanderingGamblers(
                gamblersRef.current,
                dt,
                curPlayerPos,
                false
            );

            gamblersRef.current = updatedGamblers;
            setLocalGamblers(updatedGamblers);

            // Update trade caravans
            const { updatedCaravans, completedPlayerCaravans, combatAlerts } = updateWorldCaravans(
                caravansRef.current,
                dt
            );

            caravansRef.current = updatedCaravans;
            setLocalCaravans(updatedCaravans);

            if (onUpdateCaravans) {
                onUpdateCaravans(updatedCaravans);
            }

            // Show alert if caravan was ambushed
            if (combatAlerts.length > 0) {
                if (caravanCombatTimerRef.current) {
                    clearTimeout(caravanCombatTimerRef.current);
                }
                setCaravanCombatNotice(combatAlerts[0].message);
                caravanCombatTimerRef.current = setTimeout(() => {
                    setCaravanCombatNotice(null);
                    caravanCombatTimerRef.current = null;
                }, 5000);
            }

            if (collidedSquad && onMonsterEncounter) {
                const nowMs = Date.now();
                // 7-second cooldown between encounter popups
                if (nowMs - lastEncounterTimeRef.current > 7000) {
                    lastEncounterTimeRef.current = nowMs;
                    // Freeze player movement immediately upon meeting wandering monsters
                    if (animFrameRef.current) {
                        cancelAnimationFrame(animFrameRef.current);
                        animFrameRef.current = null;
                    }
                    isMovingRef.current = false;
                    setTargetMarker(null);

                    if (onUpdateSquads) {
                        onUpdateSquads(updatedSquads);
                    }
                    onMonsterEncounter(collidedSquad);
                }
            } else if (encounteredGambler && onGamblerEncounter) {
                const nowMs = Date.now();
                // 6-second cooldown between peaceful gambler popups
                if (nowMs - lastGamblerEncounterTimeRef.current > 6000) {
                    lastGamblerEncounterTimeRef.current = nowMs;
                    // Freeze player movement immediately upon meeting wandering character
                    if (animFrameRef.current) {
                        cancelAnimationFrame(animFrameRef.current);
                        animFrameRef.current = null;
                    }
                    isMovingRef.current = false;
                    setTargetMarker(null);

                    if (onUpdateGamblers) {
                        onUpdateGamblers(updatedGamblers);
                    }
                    onGamblerEncounter(encounteredGambler);
                }
            }
        }, 400);

        return () => clearInterval(intervalId);
    }, [isEncounterActive, onMonsterEncounter, onUpdateSquads, onGamblerEncounter, onUpdateGamblers]);

    // Freeze player motion whenever isEncounterActive turns true
    useEffect(() => {
        if (isEncounterActive) {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = undefined;
            }
            isMovingRef.current = false;
            setTargetMarker(null);
        }
    }, [isEncounterActive]);

    // Fast map lookup map
    const settlementById = useMemo(() => {
        const map = new Map<string, SettlementData>();
        WORLD_SETTLEMENTS.forEach(s => map.set(s.id, s));
        return map;
    }, []);

    // Check if player is near any settlement
    const findNearbySettlement = useCallback((x: number, y: number, radius: number = 3.5): SettlementData | null => {
        for (const s of WORLD_SETTLEMENTS) {
            const dist = Math.hypot(s.x - x, s.y - y);
            if (dist <= radius) {
                return s;
            }
        }
        return null;
    }, []);

    const currentNearbySettlement = findNearbySettlement(playerPos.x, playerPos.y);

    // Center viewport on coordinates (0..100 %)
    const centerOnCoords = useCallback((x: number, y: number) => {
        if (!scrollContainerRef.current || !mapContainerRef.current) return;
        const rect = mapContainerRef.current.getBoundingClientRect();
        
        const targetPxX = (x / 100) * rect.width;
        const targetPxY = (y / 100) * rect.height;
        
        scrollContainerRef.current.scrollTo({
            left: targetPxX - scrollContainerRef.current.clientWidth / 2,
            top: targetPxY - scrollContainerRef.current.clientHeight / 2,
            behavior: 'smooth'
        });
    }, []);

    const centerOnPlayer = useCallback(() => {
        centerOnCoords(playerPos.x, playerPos.y);
    }, [playerPos.x, playerPos.y, centerOnCoords]);

    // Initial center on player
    useEffect(() => {
        const timer = setTimeout(() => {
            centerOnPlayer();
        }, 150);
        return () => clearTimeout(timer);
    }, [zoom, centerOnPlayer]);

    // Move smoothly towards target
    const movePlayerTo = useCallback((targetX: number, targetY: number, autoEnterSettlement: boolean = false, targetSettlement?: SettlementData) => {
        if (isEncounterActive) return;

        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
        }

        if (targetX < playerPos.x) {
            setPlayerFacing('left');
        } else if (targetX > playerPos.x) {
            setPlayerFacing('right');
        }

        setTargetMarker({ x: targetX, y: targetY });
        isMovingRef.current = true;
        setIsPlayerMoving(true);

        const startX = playerPos.x;
        const startY = playerPos.y;
        const distance = Math.hypot(targetX - startX, targetY - startY);
        
        const duration = Math.max(400, Math.min(2500, distance * 45));
        const startTime = performance.now();

        const step = (currentTime: number) => {
            if (isEncounterActive) {
                isMovingRef.current = false;
                setIsPlayerMoving(false);
                setTargetMarker(null);
                return;
            }

            const elapsed = currentTime - startTime;
            const progressRatio = Math.min(1, elapsed / duration);
            
            const ease = 1 - (1 - progressRatio) * (1 - progressRatio);
            const currentX = startX + (targetX - startX) * ease;
            const currentY = startY + (targetY - startY) * ease;

            playerPosRef.current = { x: currentX, y: currentY };
            setPlayerPos({ x: currentX, y: currentY });

            if (progressRatio < 1) {
                animFrameRef.current = requestAnimationFrame(step);
            } else {
                isMovingRef.current = false;
                setIsPlayerMoving(false);
                setTargetMarker(null);
                
                const finalPos: WorldPlayerPosition = {
                    x: targetX,
                    y: targetY,
                    isMoving: false
                };

                const nearby = targetSettlement || findNearbySettlement(targetX, targetY, 4.0);
                const visited = nearby && !(progress.visitedSettlementIds || []).includes(nearby.id)
                    ? [...(progress.visitedSettlementIds || []), nearby.id]
                    : (progress.visitedSettlementIds || []);

                const updated = {
                    ...progress,
                    playerPosition: finalPos,
                    visitedSettlementIds: visited
                };
                
                onUpdateProgress(updated);
                saveWorldProgress(updated);

                if (nearby) {
                    setSelectedSettlement(nearby);
                }

                if (autoEnterSettlement && nearby) {
                    onEnterSettlement(nearby);
                }
            }
        };

        animFrameRef.current = requestAnimationFrame(step);
    }, [playerPos, findNearbySettlement, progress, onUpdateProgress, onEnterSettlement, isEncounterActive]);

    // Cleanup animation and timers on unmount
    useEffect(() => {
        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
            }
            if (caravanCombatTimerRef.current) {
                clearTimeout(caravanCombatTimerRef.current);
            }
            if (waterWarningTimerRef.current) {
                clearTimeout(waterWarningTimerRef.current);
            }
        };
    }, []);

    // Global mouseup handler to guarantee dragging ends even if released outside container
    useEffect(() => {
        if (!isDragging) return;
        const handleGlobalMouseUp = () => {
            setIsDragging(false);
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging]);

    // Drag to pan handlers
    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        if (!scrollContainerRef.current) return;
        
        setIsDragging(true);
        hasDraggedRef.current = false;
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: scrollContainerRef.current.scrollLeft,
            scrollTop: scrollContainerRef.current.scrollTop
        };
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (isDragging && scrollContainerRef.current) {
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;
            
            if (Math.hypot(dx, dy) > 6) {
                hasDraggedRef.current = true;
            }
            
            scrollContainerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
            scrollContainerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
        }

        // Live terrain detection under cursor
        if (mapContainerRef.current) {
            const rect = mapContainerRef.current.getBoundingClientRect();
            const curX = ((e.clientX - rect.left) / rect.width) * 100;
            const curY = ((e.clientY - rect.top) / rect.height) * 100;
            if (curX >= 0 && curX <= 100 && curY >= 0 && curY <= 100) {
                const info = getTerrainInfo(curX, curY);
                setHoverTerrain({
                    x: Number(curX.toFixed(1)),
                    y: Number(curY.toFixed(1)),
                    isLand: info.isLand,
                    regionName: info.regionName,
                    zoneName: info.zoneName
                });
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
        if (isEncounterActive) return;

        if (hasDraggedRef.current) {
            hasDraggedRef.current = false;
            return;
        }

        if (!mapContainerRef.current) return;
        const rect = mapContainerRef.current.getBoundingClientRect();
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        const clickY = ((e.clientY - rect.top) / rect.height) * 100;

        const clickedSettlement = findNearbySettlement(clickX, clickY, 3.5);
        if (clickedSettlement) {
            setSelectedSettlement(clickedSettlement);
            setShowInspectorPanel(true);
            movePlayerTo(clickedSettlement.x, clickedSettlement.y, false, clickedSettlement);
            if (waterWarningTimerRef.current) {
                clearTimeout(waterWarningTimerRef.current);
            }
            setWaterWarning(null);
        } else {
            // Check land vs water: settlements and travel points are strictly on land
            const terrain = getTerrainInfo(clickX, clickY);
            if (!terrain.isLand) {
                const safeLand = ensureOnLand(clickX, clickY);
                if (waterWarningTimerRef.current) {
                    clearTimeout(waterWarningTimerRef.current);
                }
                setWaterWarning(`⚠️ Водна перешкода (${terrain.zoneName})! Поселення та табори дозволені лише на суші. Спрямовано до берега: [X: ${safeLand.x}%, Y: ${safeLand.y}%]`);
                movePlayerTo(safeLand.x, safeLand.y, false);
                waterWarningTimerRef.current = setTimeout(() => {
                    setWaterWarning(null);
                    waterWarningTimerRef.current = null;
                }, 5000);
            } else {
                if (waterWarningTimerRef.current) {
                    clearTimeout(waterWarningTimerRef.current);
                }
                setWaterWarning(null);
                movePlayerTo(clickX, clickY, false);
            }
        }
    };

    // LEVEL OF DETAIL (LOD) FILTERING LOGIC
    // Capping rendered pins based on zoom level & active selection prevents visual carpet clutter
    const visibleSettlements = useMemo(() => {
        let list = WORLD_SETTLEMENTS;

        // Apply Search query if active
        if (searchQuery.trim().length > 0) {
            const q = searchQuery.toLowerCase();
            return list.filter(s => s.name.toLowerCase().includes(q) || s.region.toLowerCase().includes(q));
        }

        // Apply Type Filter if explicitly active
        if (typeFilter !== 'all') {
            return list.filter(s => s.type === typeFilter);
        }

        // Apply Region Filter if selected
        if (selectedRegion) {
            return list.filter(s => s.region === selectedRegion);
        }

        // Smart LOD based on Zoom for 32-screen 4x canvas:
        // Zoom <= 0.4x: Show Cities + Currently selected settlement + Player nearby
        // Zoom 0.41x..0.85x: Show Cities + Castles + Villages
        // Zoom >= 0.86x: Show ALL settlements (Hamlets, Graveyards, Ruins)
        if (zoom <= 0.4) {
            return list.filter(s => 
                s.type === 'city' || 
                s.id === selectedSettlement?.id ||
                s.id === currentNearbySettlement?.id
            );
        } else if (zoom <= 0.85) {
            return list.filter(s => 
                s.type === 'city' || 
                s.type === 'castle' || 
                s.type === 'village' ||
                s.id === selectedSettlement?.id ||
                s.id === currentNearbySettlement?.id
            );
        } else {
            return list;
        }
    }, [searchQuery, typeFilter, selectedRegion, zoom, selectedSettlement?.id, currentNearbySettlement?.id]);

    // Parent/Child Roads for selected or nearby settlements
    const activeRoads = useMemo(() => {
        if (zoom < 0.75 && !selectedSettlement) return [];

        const roads: { x1: number; y1: number; x2: number; y2: number }[] = [];
        
        // If a city is selected, draw roads to all its sub-settlements
        if (selectedSettlement && selectedSettlement.type === 'city') {
            const prefix = `${selectedSettlement.id}_`;
            WORLD_SETTLEMENTS.forEach(s => {
                if (s.id.startsWith(prefix)) {
                    roads.push({
                        x1: selectedSettlement.x,
                        y1: selectedSettlement.y,
                        x2: s.x,
                        y2: s.y
                    });
                }
            });
        }
        return roads;
    }, [selectedSettlement, zoom]);

    // Count statistics
    const cityCount = useMemo(() => WORLD_SETTLEMENTS.filter(s => s.type === 'city').length, []);
    const castleCount = useMemo(() => WORLD_SETTLEMENTS.filter(s => s.type === 'castle').length, []);
    const villageCount = useMemo(() => WORLD_SETTLEMENTS.filter(s => s.type === 'village').length, []);
    const hamletCount = useMemo(() => WORLD_SETTLEMENTS.filter(s => s.type === 'hamlet').length, []);
    const graveyardCount = useMemo(() => WORLD_SETTLEMENTS.filter(s => s.type === 'graveyard').length, []);
    const ruinCount = useMemo(() => WORLD_SETTLEMENTS.filter(s => s.type === 'ruins').length, []);

    const totalTavernsCount = useMemo(() => WORLD_SETTLEMENTS.reduce((acc, s) => acc + (s?.taverns?.length || 0), 0), []);
    const conqueredTavernsCount = (progress.conqueredTavernIds || []).length;

    // Sub-settlements list for selected city
    const subSettlementsOfSelected = useMemo(() => {
        if (!selectedSettlement) return [];
        if (selectedSettlement.type === 'city') {
            const prefix = `${selectedSettlement.id}_`;
            return WORLD_SETTLEMENTS.filter(s => s.id.startsWith(prefix));
        }
        return [];
    }, [selectedSettlement]);

    const gridColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const gridRows = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

    return (
        <div className="relative w-full h-[calc(100vh-68px)] bg-[#070504] text-[#f5ebd7] flex flex-col overflow-hidden select-none">
            {/* Top Navigation & Status Bar */}
            <div className="flex justify-between items-center px-4 py-2 bg-[#140f0c]/95 border-b border-[#b8860b]/40 backdrop-blur-md z-20 shadow-xl flex-wrap gap-2">
                {/* Left Status Indicators */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-[#221811] px-3 py-1 rounded-full border border-[#b8860b]/40 text-xs">
                        <Navigation className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[#a89988]">Поточна локація:</span>
                        <strong className="text-amber-200 font-bold">
                            {currentNearbySettlement ? currentNearbySettlement.name : 'Дикі Землі'}
                        </strong>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#221811] px-3 py-1 rounded-full border border-[#b8860b]/40 text-xs">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-300 font-bold">{progress.playerGold}</span>
                        <span className="text-[10px] text-[#a89988]">золота</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#221811] px-3 py-1 rounded-full border border-red-900/40 text-xs">
                        <Heart className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-red-300 font-bold">
                            {progress.playerStats?.currentHp ?? calculateTotalHealth(progress.playerStats?.baseHp ?? 100, progress.playerStats?.strength ?? 15)} / {calculateTotalHealth(progress.playerStats?.baseHp ?? 100, progress.playerStats?.strength ?? 15)}
                        </span>
                        <span className="text-[10px] text-[#a89988]">здоров'я</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#221811] px-3 py-1 rounded-full border border-[#b8860b]/40 text-xs">
                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-yellow-300 font-bold">{conqueredTavernsCount} / {totalTavernsCount}</span>
                        <span className="text-[10px] text-[#a89988]">таверн підкорено</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#221811] px-3 py-1 rounded-full border border-[#b8860b]/40 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">{WORLD_SETTLEMENTS.length}</span>
                        <span className="text-[10px] text-[#a89988]">поселень світлої карти</span>
                    </div>

                    {onOpenCharacterModal && (
                        <button
                            onClick={onOpenCharacterModal}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                                (progress.playerStats?.statPoints || 0) > 0
                                    ? 'bg-yellow-500 text-black border border-yellow-300 animate-pulse'
                                    : 'bg-[#221811] hover:bg-[#342419] text-amber-300 border border-[#b8860b]/40'
                            }`}
                        >
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Рівень {progress.playerStats?.level ?? 1}</span>
                            {(progress.playerStats?.statPoints || 0) > 0 && (
                                <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-black">
                                    +{progress.playerStats?.statPoints} очок
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={centerOnPlayer}
                        className="flex items-center gap-1 px-3 py-1 bg-[#241a12] hover:bg-[#38281c] border border-amber-500/50 rounded-full text-xs text-amber-300 font-bold transition cursor-pointer"
                        title="Центрувати на герої"
                    >
                        <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                        <span>Центр</span>
                    </button>

                    {/* Land / Water Separation Control Toggle */}
                    <button
                        onClick={() => setShowTerrainControl(!showTerrainControl)}
                        className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-bold transition cursor-pointer ${
                            showTerrainControl 
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                                : 'bg-[#241a12] hover:bg-[#38281c] text-emerald-300 border-emerald-500/50'
                        }`}
                        title="Режим контролю розмежування води та суші (Всі міста строго на суші)"
                    >
                        <Waves className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Суша / Вода</span>
                        <span className="hidden xl:inline text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-200 border border-emerald-500/40">
                            100% суша
                        </span>
                    </button>

                    <button
                        onClick={() => setShowClassGuideModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 hover:from-amber-500 hover:to-yellow-400 border border-yellow-300 rounded-full text-xs text-stone-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.5)] transition cursor-pointer"
                        title="Посібник усіх 50+ класів, заклять, призовів та здібностей"
                    >
                        <BookOpen className="w-3.5 h-3.5 text-stone-950" />
                        <span>Посібник класів</span>
                        <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded-full bg-stone-950 text-amber-300 border border-amber-500/40">
                            50+
                        </span>
                    </button>

                    <button
                        onClick={() => setShowMinimap(!showMinimap)}
                        className={`flex items-center gap-1 px-3 py-1 border rounded-full text-xs font-bold transition cursor-pointer ${
                            showMinimap ? 'bg-amber-600 text-black border-yellow-400' : 'bg-[#241a12] hover:bg-[#38281c] text-amber-300 border-amber-500/50'
                        }`}
                        title="Міні-карта"
                    >
                        <MapIcon className="w-3.5 h-3.5" />
                        <span>Радар</span>
                    </button>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#a89988]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Пошук поселення або регіону..."
                            className="bg-[#1f150e] border border-[#b8860b]/40 rounded-full pl-8 pr-3 py-1 text-xs text-[#f5ebd7] placeholder-[#7d7060] focus:outline-none focus:border-[#d4af37] w-36 sm:w-48"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Zoom Presets: Cinematic 4K canvas with safe GPU limits */}
                    <div className="flex items-center bg-[#1f150e] border border-[#b8860b]/40 rounded-full p-0.5">
                        <button 
                            onClick={() => setZoom(z => Math.max(0.35, Number((z * 0.8).toFixed(2))))}
                            className="p-1 hover:bg-[#342419] rounded-full text-[#c4b5a0] hover:text-[#d4af37] cursor-pointer"
                            title="Зменшити масштаб"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="flex items-center px-1 gap-0.5 border-x border-[#b8860b]/30">
                            {[
                                { val: 0.35, label: '0.35x' },
                                { val: 0.5, label: '0.5x' },
                                { val: 0.75, label: '0.75x' },
                                { val: 1.0, label: '1.0x (4K)' },
                                { val: 1.25, label: '1.25x' },
                                { val: 1.5, label: '1.5x' }
                            ].map(({ val, label }) => (
                                <button
                                    key={val}
                                    onClick={() => setZoom(val)}
                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition ${
                                        Math.abs(zoom - val) < 0.05
                                            ? 'bg-amber-500 text-black font-black shadow-sm' 
                                            : 'text-[#d4af37] hover:bg-[#342419]'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => setZoom(z => Math.min(1.5, Number((z * 1.25).toFixed(2))))}
                            className="p-1 hover:bg-[#342419] rounded-full text-[#c4b5a0] hover:text-[#d4af37] cursor-pointer"
                            title="Збільшити масштаб"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {currentNearbySettlement && (
                        <button
                            onClick={() => onEnterSettlement(currentNearbySettlement)}
                            className="flex items-center gap-1 px-3.5 py-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-black text-xs rounded-full shadow-lg hover:scale-105 transition-all animate-pulse cursor-pointer"
                        >
                            <Beer className="w-3.5 h-3.5" />
                            <span>Увійти в {currentNearbySettlement.name}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Region & Type Filter Tabs Sub-Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#0f0b08] border-b border-[#b8860b]/30 z-15 text-xs overflow-x-auto scrollbar-none gap-3">
                {/* Type Filter Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-[#a89988] flex items-center gap-1 font-bold">
                        <Filter className="w-3 h-3 text-amber-400" /> Тип:
                    </span>
                    <button
                        onClick={() => { setTypeFilter('all'); setSelectedRegion(null); }}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            typeFilter === 'all' && !selectedRegion ? 'bg-amber-500 text-black' : 'bg-[#1f150e] text-[#c4b5a0] hover:bg-[#342419]'
                        }`}
                    >
                        Усі ({WORLD_SETTLEMENTS.length})
                    </button>
                    <button
                        onClick={() => setTypeFilter('city')}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            typeFilter === 'city' ? 'bg-red-600 text-white' : 'bg-[#1f150e] text-[#c4b5a0] hover:bg-[#342419]'
                        }`}
                    >
                        🏰 Міста ({cityCount})
                    </button>
                    <button
                        onClick={() => setTypeFilter('castle')}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            typeFilter === 'castle' ? 'bg-stone-600 text-white' : 'bg-[#1f150e] text-[#c4b5a0] hover:bg-[#342419]'
                        }`}
                    >
                        🛡️ Замки ({castleCount})
                    </button>
                    <button
                        onClick={() => setTypeFilter('village')}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            typeFilter === 'village' ? 'bg-amber-700 text-white' : 'bg-[#1f150e] text-[#c4b5a0] hover:bg-[#342419]'
                        }`}
                    >
                        🏘️ Села ({villageCount})
                    </button>
                    <button
                        onClick={() => setTypeFilter('hamlet')}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            typeFilter === 'hamlet' ? 'bg-emerald-700 text-white' : 'bg-[#1f150e] text-[#c4b5a0] hover:bg-[#342419]'
                        }`}
                    >
                        🏡 Хутори ({hamletCount})
                    </button>
                    <button
                        onClick={() => setTypeFilter('graveyard')}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            typeFilter === 'graveyard' ? 'bg-purple-700 text-white' : 'bg-[#1f150e] text-[#c4b5a0] hover:bg-[#342419]'
                        }`}
                    >
                        🪦 Кладовища ({graveyardCount})
                    </button>
                    <button
                        onClick={() => setTypeFilter('ruins')}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            typeFilter === 'ruins' ? 'bg-rose-800 text-white' : 'bg-[#1f150e] text-[#c4b5a0] hover:bg-[#342419]'
                        }`}
                    >
                        🏛️ Руїни ({ruinCount})
                    </button>
                    <button
                        onClick={() => setShowMonstersPanel(prev => !prev)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 ${
                            showMonstersPanel
                                ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                                : 'bg-[#220e0b] text-red-300 hover:bg-[#381611] border border-red-800/70'
                        }`}
                        title="Ворожі банди грабіжників, головорізів та розбійників на мапі світу"
                    >
                        <Skull className="w-3.5 h-3.5 text-red-400" />
                        <span>Ворожі Банди ({localSquads.length})</span>
                    </button>
                    <button
                        onClick={() => setShowGamblersPanel(prev => !prev)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 ${
                            showGamblersPanel
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                                : 'bg-[#1e170f] text-amber-300 hover:bg-[#322314] border border-amber-600/60'
                        }`}
                        title="Мандрівні майстри ігор — окремі суперники для кожної гри на мапі"
                    >
                        <Dices className="w-3.5 h-3.5 text-amber-400" />
                        <span>Мандрівні Гравці ({localGamblers.length})</span>
                    </button>
                    {onOpenQuestModal && (
                        <button
                            onClick={onOpenQuestModal}
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-stone-950 shadow-md border border-yellow-300"
                            title="Відкрити журнал квестів та переглянути активні цілі"
                        >
                            <Scroll className="w-3.5 h-3.5 text-stone-950" />
                            <span>Квести ({progress.activeQuests?.length || 0})</span>
                            {(progress.activeQuests || []).some(q => q.status === 'completed') && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                        </button>
                    )}
                    {/* Time Freeze Map Status Badge */}
                    {isEncounterActive && (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/70 text-amber-300 text-[11px] font-bold animate-pulse shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                            <span>⏳</span>
                            <span>ЧАС ЗУПИНЕНО</span>
                        </div>
                    )}
                </div>

                {/* Region Quick-Jump Carousel */}
                <div className="flex items-center gap-1.5 shrink-0 border-l border-[#b8860b]/30 pl-3">
                    <span className="text-[10px] text-[#a89988] font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" /> Регіон:
                    </span>
                    {LAND_REGIONS.map(reg => (
                        <button
                            key={reg.name}
                            onClick={() => {
                                setSelectedRegion(selectedRegion === reg.name ? null : reg.name);
                                setTypeFilter('all');
                                // Center on region mid
                                const midX = (reg.minX + reg.maxX) / 2;
                                const midY = (reg.minY + reg.maxY) / 2;
                                centerOnCoords(midX, midY);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition whitespace-nowrap ${
                                selectedRegion === reg.name 
                                    ? 'bg-amber-500 text-black font-black' 
                                    : 'bg-[#1a120b] hover:bg-[#2e1d10] text-[#d4af37] border border-[#b8860b]/30'
                            }`}
                        >
                            {reg.name.split(' ')[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Interactive World Canvas & Inspector Panel Flex Layout */}
            <div className="flex-1 relative flex overflow-hidden">
                {/* Active Quest Objective HUD Overlay (Witcher/Skyrim Style) */}
                {focusedQuestObjective && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-4 left-4 z-40 max-w-xs sm:max-w-sm bg-[#160f0a]/95 border-2 border-amber-500/70 rounded-2xl shadow-[0_0_24px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden text-stone-200"
                    >
                        {/* Banner Header */}
                        <div className="px-3 py-2 bg-gradient-to-r from-[#28180d] to-[#1a1008] border-b border-[#b8860b]/40 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 truncate">
                                <span className="text-amber-400">🎯</span>
                                <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider truncate">
                                    {focusedQuestObjective.quest.title}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => setIsQuestHudMinimized(prev => !prev)}
                                    className="p-1 text-stone-400 hover:text-amber-200 text-xs transition cursor-pointer"
                                    title={isQuestHudMinimized ? "Розгорнути ціль" : "Згорнути"}
                                >
                                    {isQuestHudMinimized ? '▼' : '▲'}
                                </button>
                            </div>
                        </div>

                        {/* Banner Body */}
                        {!isQuestHudMinimized && (
                            <div className="p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="text-xs text-stone-200 leading-snug font-medium flex-1">
                                        {focusedQuestObjective.objective.text}
                                        {focusedQuestObjective.objective.isOptional && (
                                            <span className="ml-1 text-[10px] text-purple-300 font-bold bg-purple-950/70 px-1.5 py-0.5 rounded border border-purple-500/40">
                                                ⭐ Бонус
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-mono font-black text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-600/40 shrink-0">
                                        {focusedQuestObjective.objective.currentCount}/{focusedQuestObjective.objective.requiredCount}
                                    </span>
                                </div>

                                {/* Quick Action buttons */}
                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800 text-[11px]">
                                    {(focusedQuestObjective.objective.targetCoords || focusedQuestObjective.objective.targetSettlementId) ? (
                                        <button
                                            onClick={() => {
                                                const targetSettlement = focusedQuestObjective.objective.targetSettlementId 
                                                    ? WORLD_SETTLEMENTS.find(s => s.id === focusedQuestObjective.objective.targetSettlementId)
                                                    : null;
                                                const coords = focusedQuestObjective.objective.targetCoords || targetSettlement;
                                                if (coords) {
                                                    centerOnCoords(coords.x, coords.y);
                                                    if (targetSettlement) {
                                                        setSelectedSettlement(targetSettlement);
                                                        setShowInspectorPanel(true);
                                                    }
                                                }
                                            }}
                                            className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold rounded-lg border border-amber-500/50 flex items-center gap-1 cursor-pointer transition text-[10px]"
                                        >
                                            <Compass className="w-3 h-3 text-amber-400" />
                                            <span>Навести на ціль</span>
                                        </button>
                                    ) : (
                                        <span className="text-[10px] text-stone-500 italic">Полювання на карті</span>
                                    )}

                                    {onOpenQuestModal && (
                                        <button
                                            onClick={onOpenQuestModal}
                                            className="px-2 py-1 bg-[#251a11] hover:bg-[#342417] text-stone-300 hover:text-amber-200 font-bold rounded-lg border border-stone-700 flex items-center gap-1 cursor-pointer transition text-[10px]"
                                        >
                                            <Scroll className="w-3 h-3 text-amber-400" />
                                            <span>Всі цілі</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Time Freeze Indicator Banner */}
                <AnimatePresence>
                    {isEncounterActive && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-[#1c120a]/95 via-[#2b170c]/95 to-[#1c120a]/95 border-2 border-amber-500/80 rounded-full px-5 py-2 shadow-[0_0_30px_rgba(245,158,11,0.5)] backdrop-blur-md flex items-center gap-3 text-amber-200 pointer-events-none select-none"
                        >
                            <span className="text-lg">⏳</span>
                            <div className="flex items-center gap-2.5">
                                <span className="text-xs font-black font-serif text-amber-300 tracking-wider">ЧАС НА КАРТІ ЗУПИНЕНО</span>
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                <span className="text-[11px] text-stone-300 border-l border-amber-500/40 pl-2">
                                    Зустріч із персонажем • Світ Елдрії завмер
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Map View Container */}
                <div 
                    ref={scrollContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className={`flex-1 relative overflow-auto scrollbar-thin scrollbar-thumb-[#b8860b]/40 bg-[#050403] p-4 ${
                        isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                >
                    {/* Cartographic Frame Canvas */}
                    <div 
                        ref={mapContainerRef}
                        onClick={handleMapClick}
                        style={{
                            width: `${BASE_MAP_WIDTH * zoom}px`,
                            height: `${BASE_MAP_HEIGHT * zoom}px`,
                            maxWidth: '6144px',
                            maxHeight: '3456px',
                            contain: 'layout paint',
                            transform: 'translate3d(0, 0, 0)',
                            transition: 'width 0.15s ease-out, height 0.15s ease-out'
                        }}
                        className="relative shrink-0 shadow-2xl overflow-hidden bg-[#0d1520] border-[16px] border-[#18110b] outline outline-2 outline-[#b8860b]/60 flex flex-col select-none"
                    >
                        {/* Time Freeze Subtle Visual Frame on Map */}
                        {isEncounterActive && (
                            <div className="absolute inset-0 pointer-events-none z-30 ring-4 ring-amber-500/40 shadow-[inset_0_0_80px_rgba(245,158,11,0.2)] transition-opacity duration-300" />
                        )}
                        {/* Top Coordinate Border A-J */}
                        <div className="h-7 bg-[#140f0a] border-b-2 border-[#b8860b]/60 flex items-center justify-between px-12 z-20 text-xs font-serif font-black text-[#d4af37] tracking-widest select-none">
                            {gridColumns.map(col => (
                                <span key={`top-${col}`} className="flex-1 text-center">{col}</span>
                            ))}
                        </div>

                        {/* Main Surface Canvas */}
                        <div className="flex-1 relative flex">
                            {/* Left Coordinate Border 1-10 */}
                            <div className="w-7 bg-[#140f0a] border-r-2 border-[#b8860b]/60 flex flex-col items-center justify-between py-6 z-20 text-xs font-serif font-black text-[#d4af37] select-none">
                                {gridRows.map(row => (
                                    <span key={`left-${row}`} className="flex-1 flex items-center justify-center">{row}</span>
                                ))}
                            </div>

                            {/* Map Artwork Layer */}
                            <div className="flex-1 relative overflow-hidden bg-[#183048]">
                                <img 
                                    src={worldMapImg}
                                    alt="Континент Елдрія - Карта Світу"
                                    referrerPolicy="no-referrer"
                                    loading="eager"
                                    decoding="async"
                                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none filter brightness-100 contrast-105"
                                />

                                {/* Water & Land Separation Visual System Overlay */}
                                {showTerrainControl && (
                                    <div className="absolute inset-0 pointer-events-none z-5">
                                        {/* Water Bodies Exclusion Zones (Blue Tint & Stripes) */}
                                        {WATER_BODIES.map(w => (
                                            <div
                                                key={w.id}
                                                style={{
                                                    left: `${w.minX}%`,
                                                    top: `${w.minY}%`,
                                                    width: `${w.maxX - w.minX}%`,
                                                    height: `${w.maxY - w.minY}%`
                                                }}
                                                className="absolute bg-blue-900/35 border-2 border-dashed border-sky-400/70 flex flex-col items-center justify-center text-center p-2 rounded backdrop-blur-[1px]"
                                            >
                                                <Waves className="w-5 h-5 text-sky-300 opacity-80 animate-pulse" />
                                                <span className="text-[10px] font-black text-sky-200 tracking-wider uppercase font-serif drop-shadow-md">
                                                    {w.name}
                                                </span>
                                                <span className="text-[9px] text-sky-300/90 font-bold">
                                                    ⛔ Водна зона (Міста заборонені)
                                                </span>
                                            </div>
                                        ))}

                                        {/* Land Continents Permitted Zones (Green Tint & Outline) */}
                                        {LAND_CONTINENTS.map(land => (
                                            <div
                                                key={land.id}
                                                style={{
                                                    left: `${land.bounds.minX}%`,
                                                    top: `${land.bounds.minY}%`,
                                                    width: `${land.bounds.maxX - land.bounds.minX}%`,
                                                    height: `${land.bounds.maxY - land.bounds.minY}%`
                                                }}
                                                className="absolute border border-emerald-500/50 bg-emerald-500/5 pointer-events-none rounded"
                                            >
                                                <div className="absolute top-1 left-2 flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/60 px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-300">
                                                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                                                    <span>{land.name} (Суша)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}


                                {/* Water Click Warning Banner */}
                                <AnimatePresence>
                                    {waterWarning && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-red-950/95 border-2 border-red-500 text-red-200 px-4 py-2 rounded-lg shadow-2xl text-xs font-bold flex items-center gap-2 max-w-lg pointer-events-auto"
                                        >
                                            <Waves className="w-4 h-4 text-sky-400 shrink-0" />
                                            <span>{waterWarning}</span>
                                            <button 
                                                onClick={() => setWaterWarning(null)} 
                                                className="ml-auto text-white/70 hover:text-white cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Title Box Top-Left */}
                                <div className="absolute top-6 left-6 z-10 bg-[#f4ebd0] text-[#2c1d11] border-2 border-[#5c3e21] rounded p-4 shadow-2xl max-w-sm font-serif pointer-events-none">
                                    <div className="text-[10px] tracking-[0.25em] font-bold text-[#8c5a2b] uppercase border-b border-[#8c5a2b]/30 pb-0.5 mb-1 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-amber-600" />
                                        ВЕЛИКА КАРТА СВІТУ (4K • АТЛАС)
                                    </div>
                                    <h1 className="text-xl sm:text-2xl font-black tracking-wide text-[#1f1107] uppercase">
                                        КОНТИНЕНТИ ЕЛДРІЇ
                                    </h1>
                                    <div className="text-[11px] font-bold text-[#5c3e21] mt-0.5">
                                        {cityCount} Міст • {castleCount} Замків • {villageCount} Сіл • {hamletCount} Хуторів
                                    </div>
                                    <div className="mt-1 text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                        Контроль водойм: всі {WORLD_SETTLEMENTS.length} поселень строго на суші
                                    </div>
                                </div>

                                {/* Map Legend Top-Right */}
                                <div className="absolute top-6 right-6 z-10 bg-[#f4ebd0] text-[#2c1d11] border-2 border-[#5c3e21] rounded p-3 shadow-2xl text-xs font-serif pointer-events-none min-w-[200px]">
                                    <div className="font-black text-center text-xs border-b-2 border-[#5c3e21]/40 pb-1 mb-2 tracking-widest uppercase">
                                        ЛЕГЕНДА СВІТУ (АТЛАС ЕЛДРІЇ)
                                    </div>
                                    <div className="space-y-1 text-[11px]">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded bg-red-950 border border-amber-400 flex items-center justify-center text-[10px]">🏰</span>
                                            <span className="font-bold text-[#1f1107]">Місто ({cityCount}) — Розкидані по всій мапі</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded bg-stone-900 border border-stone-400 flex items-center justify-center text-[10px]">🛡️</span>
                                            <span className="font-bold text-[#1f1107]">Замок ({castleCount})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded bg-amber-900 border border-amber-500 flex items-center justify-center text-[10px]">🏘️</span>
                                            <span className="font-bold text-[#1f1107]">Село ({villageCount})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded bg-emerald-950 border border-emerald-500 flex items-center justify-center text-[10px]">🏡</span>
                                            <span className="font-bold text-[#1f1107]">Хутір ({hamletCount})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded bg-purple-950 border border-purple-400 flex items-center justify-center text-[10px]">🪦</span>
                                            <span className="font-bold text-[#1f1107]">Кладовище ({graveyardCount})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded bg-rose-950 border border-rose-400 flex items-center justify-center text-[10px]">🏛️</span>
                                            <span className="font-bold text-[#1f1107]">Руїни ({ruinCount})</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-1 border-t border-[#5c3e21]/30 text-[10px] text-emerald-900 font-bold flex items-center justify-between">
                                        <span>🟢 На суші: {WORLD_SETTLEMENTS.length}</span>
                                        <span>🔵 На воді: 0</span>
                                    </div>
                                </div>

                                {/* Compass Rose Bottom-Left */}
                                <div className="absolute bottom-6 left-6 z-10 flex flex-col items-start gap-3 pointer-events-none">
                                    <div className="relative w-20 h-20 rounded-full border-2 border-[#5c3e21] bg-[#f4ebd0]/90 backdrop-blur-sm shadow-2xl flex items-center justify-center p-2">
                                        <Compass className="w-14 h-14 text-[#1f1107]" />
                                        <span className="absolute top-1 text-[10px] font-black text-[#1f1107] font-serif">N</span>
                                        <span className="absolute bottom-1 text-[10px] font-black text-[#1f1107] font-serif">S</span>
                                        <span className="absolute left-1.5 text-[10px] font-black text-[#1f1107] font-serif">W</span>
                                        <span className="absolute right-1.5 text-[10px] font-black text-[#1f1107] font-serif">E</span>
                                    </div>
                                </div>

                                {/* Live Terrain Inspection HUD */}
                                <div className="absolute bottom-6 left-28 z-10 bg-[#16100c]/95 border-2 border-[#b8860b]/60 rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-xs font-mono text-[#e6d7c3] flex flex-col gap-1 pointer-events-none max-w-md">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-amber-400">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>СИСТЕМА РОЗМЕЖУВАННЯ СУШІ ТА ВОДИ</span>
                                    </div>
                                    {hoverTerrain ? (
                                        <div className="flex items-center gap-2 text-[11px] flex-wrap">
                                            <span className="text-amber-200 font-bold">X: {hoverTerrain.x}% Y: {hoverTerrain.y}%</span>
                                            <span className="text-stone-500">•</span>
                                            {hoverTerrain.isLand ? (
                                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                    🟢 Тверда Суша: {hoverTerrain.regionName}
                                                </span>
                                            ) : (
                                                <span className="text-sky-400 font-bold flex items-center gap-1">
                                                    🔵 Вода: {hoverTerrain.zoneName} (Заборонено)
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-stone-400">
                                            Наведіть курсор на будь-яку точку для аналізу суші/води
                                        </div>
                                    )}
                                </div>

                                {/* Target Marker animation */}
                                {targetMarker && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: [1, 1.25, 1], opacity: 1 }}
                                        transition={{ repeat: Infinity, duration: 0.8 }}
                                        style={{
                                            left: `${targetMarker.x}%`,
                                            top: `${targetMarker.y}%`
                                        }}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                                    >
                                        <div className="w-9 h-9 rounded-full border-2 border-amber-300 bg-amber-400/30 flex items-center justify-center shadow-[0_0_16px_rgba(251,191,36,0.8)]">
                                            <Crosshair className="w-5 h-5 text-amber-300" />
                                        </div>
                                    </motion.div>
                                )}

                                {/* High-Performance Unified Vector Layer: Roads, Navigation, Monster & Gambler Trajectories */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden">
                                    {/* Active Trade Roads */}
                                    {activeRoads.map((road, idx) => (
                                        <line
                                            key={`road-${idx}`}
                                            x1={`${road.x1}%`}
                                            y1={`${road.y1}%`}
                                            x2={`${road.x2}%`}
                                            y2={`${road.y2}%`}
                                            stroke="#f59e0b"
                                            strokeWidth={Math.max(1.5, 2 * zoom)}
                                            strokeDasharray="5 5"
                                            opacity="0.75"
                                        />
                                    ))}

                                    {/* Movement Path to Target */}
                                    {targetMarker && (
                                        <line 
                                            x1={`${playerPos.x}%`} 
                                            y1={`${playerPos.y}%`} 
                                            x2={`${targetMarker.x}%`} 
                                            y2={`${targetMarker.y}%`} 
                                            stroke="#f59e0b" 
                                            strokeWidth={Math.max(2, 2.5 * zoom)} 
                                            strokeDasharray="6 6" 
                                            opacity="0.9" 
                                        />
                                    )}

                                    {/* Wandering Monster Trajectory Trails */}
                                    {showMonsterTrails && localSquads.map((squad) => (
                                        <line 
                                            key={`trail-${squad.id}`}
                                            x1={`${squad.x}%`} 
                                            y1={`${squad.y}%`} 
                                            x2={`${squad.currentGoal.targetX}%`} 
                                            y2={`${squad.currentGoal.targetY}%`} 
                                            stroke={squad.themeColor} 
                                            strokeWidth={Math.max(1.5, 1.8 * zoom)} 
                                            strokeDasharray="4 4" 
                                            opacity="0.6" 
                                        />
                                    ))}

                                    {/* Wandering Gambler Trajectory Trails */}
                                    {showGamblerTrails && localGamblers.map((gambler) => (
                                        <line 
                                            key={`trail-gambler-${gambler.id}`}
                                            x1={`${gambler.x}%`} 
                                            y1={`${gambler.y}%`} 
                                            x2={`${gambler.currentGoal.targetX}%`} 
                                            y2={`${gambler.currentGoal.targetY}%`} 
                                            stroke={gambler.themeColor} 
                                            strokeWidth={Math.max(1.2, 1.4 * zoom)} 
                                            strokeDasharray="3 3" 
                                            opacity="0.5" 
                                        />
                                    ))}
                                </svg>

                                {/* Wandering Monster Squad Character Tokens (Standing Figurines matching player & gamblers) */}
                                {localSquads.map((squad) => {
                                    const isSelected = selectedMonsterSquad?.id === squad.id;

                                    return (
                                        <MonsterSquadMapToken
                                            key={`squad-${squad.id}`}
                                            squad={squad}
                                            isSelected={isSelected}
                                            zoom={zoom}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedMonsterSquad(squad);
                                                if (onMonsterEncounter) {
                                                    onMonsterEncounter(squad);
                                                }
                                            }}
                                        />
                                    );
                                })}

                                {/* Wandering Gambler Character Tokens (Pixel-Art Figurines matching reference design) */}
                                {localGamblers.map((gambler) => {
                                    const isSelected = selectedGambler?.id === gambler.id;

                                    return (
                                        <WanderingGamblerMapToken
                                            key={`gambler-${gambler.id}`}
                                            gambler={gambler}
                                            isSelected={isSelected}
                                            zoom={zoom}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedGambler(gambler);
                                                if (onGamblerEncounter) {
                                                    onGamblerEncounter(gambler);
                                                }
                                            }}
                                        />
                                    );
                                })}

                                {/* Active Trade Caravans on the World Map (Moving wagons & armed escort guards) */}
                                {localCaravans.map((caravan) => {
                                    const isSelected = selectedCaravan?.id === caravan.id;

                                    return (
                                        <CaravanMapToken
                                            key={`caravan-${caravan.id}`}
                                            caravan={caravan}
                                            isSelected={isSelected}
                                            zoom={zoom}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedCaravan(caravan);
                                            }}
                                        />
                                    );
                                })}

                                {/* Rendered Visible Pins (Optimized via LOD) */}
                                {visibleSettlements.map((settlement) => {
                                    const isSelected = selectedSettlement?.id === settlement.id;
                                    const isCurrentLocation = currentNearbySettlement?.id === settlement.id;
                                    
                                    const conqueredCount = (settlement?.taverns || []).filter(t => 
                                        (progress?.conqueredTavernIds || []).includes(t.id)
                                    ).length;
                                    const isFullyConquered = (settlement?.taverns || []).length > 0 && conqueredCount === (settlement?.taverns || []).length;

                                    let iconBg = 'bg-stone-900 border-stone-400 text-stone-200';
                                    let sizeClass = 'w-7 h-7 sm:w-8 sm:h-8';
                                    let badgeSymbol = '🏡';

                                    if (settlement.type === 'city') {
                                        iconBg = 'bg-gradient-to-b from-red-900 to-amber-950 border-amber-400 text-amber-300 shadow-[0_0_16px_rgba(217,119,6,0.7)]';
                                        sizeClass = 'w-9 h-9 sm:w-11 sm:h-11';
                                        badgeSymbol = '🏰';
                                    } else if (settlement.type === 'castle') {
                                        iconBg = 'bg-gradient-to-b from-stone-800 to-stone-950 border-stone-300 text-stone-200 shadow-lg';
                                        sizeClass = 'w-8 h-8 sm:w-9 sm:h-9';
                                        badgeSymbol = '🛡️';
                                    } else if (settlement.type === 'village') {
                                        iconBg = 'bg-gradient-to-b from-amber-900 to-amber-950 border-amber-500/80 text-amber-200 shadow-md';
                                        sizeClass = 'w-7 h-7 sm:w-8 sm:h-8';
                                        badgeSymbol = '🏘️';
                                    } else if (settlement.type === 'hamlet') {
                                        iconBg = 'bg-gradient-to-b from-emerald-950 to-emerald-900 border-emerald-500/80 text-emerald-200 shadow-sm';
                                        sizeClass = 'w-6 h-6 sm:w-7 sm:h-7';
                                        badgeSymbol = '🏡';
                                    } else if (settlement.type === 'graveyard') {
                                        iconBg = 'bg-gradient-to-b from-purple-950 to-slate-900 border-purple-400 text-purple-200 shadow-md';
                                        sizeClass = 'w-7 h-7 sm:w-8 sm:h-8';
                                        badgeSymbol = '🪦';
                                    } else if (settlement.type === 'ruins') {
                                        iconBg = 'bg-gradient-to-b from-rose-950 to-stone-900 border-rose-400 text-rose-200 shadow-md';
                                        sizeClass = 'w-7 h-7 sm:w-8 sm:h-8';
                                        badgeSymbol = '🏛️';
                                    }

                                    const matchingObjective = activeQuestObjectives.find(item => 
                                        item.objective.targetSettlementId === settlement.id ||
                                        (item.objective.targetSettlementName && item.objective.targetSettlementName.toLowerCase() === settlement.name.toLowerCase())
                                    );
                                    const isTrackedTarget = Boolean(matchingObjective && (
                                        matchingObjective.quest.id === progress.trackedQuestId ||
                                        matchingObjective.objective.id === progress.trackedObjectiveId
                                    ));

                                    return (
                                        <div
                                            key={settlement.id}
                                            style={{
                                                left: `${settlement.x}%`,
                                                top: `${settlement.y}%`
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSettlement(settlement);
                                                setShowInspectorPanel(true);
                                                movePlayerTo(settlement.x, settlement.y, false, settlement);
                                            }}
                                            className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10 transition-transform ${
                                                isSelected || isCurrentLocation ? 'scale-125 z-20' : 'hover:scale-115'
                                            }`}
                                        >
                                            {/* Quest Objective Beacon Badge over Settlement */}
                                            {matchingObjective && (
                                                <div className={`absolute -top-7 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black shadow-2xl border whitespace-nowrap pointer-events-none ${
                                                    isTrackedTarget 
                                                        ? 'bg-amber-400 text-stone-950 border-yellow-200 shadow-[0_0_14px_rgba(245,158,11,0.9)] animate-bounce' 
                                                        : 'bg-amber-950/95 text-amber-300 border-amber-500/60'
                                                }`}>
                                                    <Target className="w-2.5 h-2.5 text-current shrink-0" />
                                                    <span className="max-w-[80px] truncate">{matchingObjective.quest.title}</span>
                                                </div>
                                            )}

                                            {/* Glowing halo if current or selected */}
                                            {(isCurrentLocation || isSelected) && (
                                                <div className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
                                            )}

                                            <div className={`relative ${sizeClass} rounded-full border-2 flex items-center justify-center ${iconBg} shadow-xl`}>
                                                <span className={settlement.type === 'city' ? 'text-sm sm:text-base' : 'text-xs'}>
                                                    {badgeSymbol}
                                                </span>

                                                {isFullyConquered && (
                                                    <div className="absolute -top-1.5 -right-1 bg-yellow-400 text-black rounded-full p-0.5 shadow-md">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-950 fill-emerald-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Name Tag */}
                                            <div className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none flex flex-col items-center transition-opacity ${
                                                zoom >= 4 || isSelected || isCurrentLocation || settlement.type === 'city' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                            }`}>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-2xl font-serif ${
                                                    settlement.type === 'city'
                                                        ? 'bg-[#1f150e]/95 border-2 border-amber-400 text-amber-200 font-black'
                                                        : 'bg-[#140e0a]/90 border border-stone-500 text-stone-200'
                                                }`}>
                                                    {settlement.name}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Hero Character Token (Tactical Medieval Mercenary Sprite) */}
                                <PlayerMapToken
                                    x={playerPos.x}
                                    y={playerPos.y}
                                    isMoving={isPlayerMoving}
                                    facingDirection={playerFacing}
                                    progress={progress}
                                    onOpenCharacterModal={onOpenCharacterModal}
                                />
                            </div>

                            {/* Right Coordinate Border 1-10 */}
                            <div className="w-7 bg-[#140f0a] border-l-2 border-[#b8860b]/60 flex flex-col items-center justify-between py-6 z-20 text-xs font-serif font-black text-[#d4af37] select-none">
                                {gridRows.map(row => (
                                    <span key={`right-${row}`} className="flex-1 flex items-center justify-center">{row}</span>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Coordinate Border A-J */}
                        <div className="h-7 bg-[#140f0a] border-t-2 border-[#b8860b]/60 flex items-center justify-between px-12 z-20 text-xs font-serif font-black text-[#d4af37] tracking-widest select-none">
                            {gridColumns.map(col => (
                                <span key={`bottom-${col}`} className="flex-1 text-center">{col}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side Parchment Inspector Drawer Panel */}
                <AnimatePresence>
                    {showInspectorPanel && selectedSettlement && (
                        <motion.div
                            initial={{ x: 380, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 380, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-80 sm:w-96 bg-[#16100c] border-l-2 border-[#b8860b]/60 shadow-2xl z-30 flex flex-col h-full overflow-hidden"
                        >
                            {/* Panel Header */}
                            <div className="p-4 bg-gradient-to-r from-[#281a10] to-[#1e130c] border-b border-[#b8860b]/40 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">
                                        {selectedSettlement.type === 'city' ? '🏰' : selectedSettlement.type === 'castle' ? '🛡️' : selectedSettlement.type === 'village' ? '🏘️' : selectedSettlement.type === 'hamlet' ? '🏡' : selectedSettlement.type === 'graveyard' ? '🪦' : '🏛️'}
                                    </span>
                                    <div>
                                        <h2 className="text-base font-black font-serif text-amber-200">
                                            {selectedSettlement.name}
                                        </h2>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">
                                                {selectedSettlement.region}
                                            </span>
                                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                                                Тверда суша
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowInspectorPanel(false)}
                                    className="p-1 text-stone-400 hover:text-white rounded hover:bg-[#342419] cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Panel Body Content */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs scrollbar-thin scrollbar-thumb-[#b8860b]/40">
                                {/* Description Box */}
                                <div className="bg-[#201610] p-3 rounded border border-[#b8860b]/30 text-[#e6d7c3] leading-relaxed italic">
                                    "{selectedSettlement.description}"
                                </div>

                                {/* Main Action Buttons */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => onEnterSettlement(selectedSettlement)}
                                        className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-black font-black text-sm rounded shadow-lg flex items-center justify-center gap-2 transition hover:scale-[1.02] cursor-pointer"
                                    >
                                        {selectedSettlement.type === 'graveyard' ? (
                                            <>
                                                <span className="text-base">🪦</span>
                                                <span>УВІЙТИ НА КЛАДОВИЩЕ {selectedSettlement.name.toUpperCase()}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Beer className="w-4 h-4" />
                                                <span>УВІЙТИ В {selectedSettlement.name.toUpperCase()}</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => movePlayerTo(selectedSettlement.x, selectedSettlement.y, false, selectedSettlement)}
                                        className="w-full py-2 px-4 bg-[#281a10] hover:bg-[#382417] text-amber-300 font-bold text-xs rounded border border-amber-500/50 flex items-center justify-center gap-2 transition cursor-pointer"
                                    >
                                        <Footprints className="w-4 h-4 text-amber-400" />
                                        <span>{selectedSettlement.type === 'graveyard' ? 'Бігти до цього кладовища' : 'Бігти до цього поселення'}</span>
                                    </button>
                                </div>

                                {/* Taverns / Crypts List Section */}
                                <div className="space-y-2 pt-2 border-t border-[#b8860b]/30">
                                    <h3 className="font-serif font-black text-amber-300 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                                        {selectedSettlement.type === 'graveyard' ? (
                                            <>
                                                <span className="text-sm">💀</span>
                                                <span>Склепи та Нежить (скелети, зомбі, гулі) ({(selectedSettlement?.taverns || []).length})</span>
                                            </>
                                        ) : (
                                            <>
                                                <Beer className="w-3.5 h-3.5 text-amber-400" />
                                                <span>Таверни та Дуелянти ({(selectedSettlement?.taverns || []).length})</span>
                                            </>
                                        )}
                                    </h3>

                                    <div className="space-y-2">
                                        {(selectedSettlement?.taverns || []).map((tavern) => {
                                            const isConquered = (progress?.conqueredTavernIds || []).includes(tavern.id);
                                            const isGrave = selectedSettlement.type === 'graveyard';
                                            return (
                                                <div 
                                                    key={tavern.id}
                                                    className={`border rounded p-2.5 space-y-1.5 ${isGrave ? 'bg-[#1b1220] border-purple-800/40' : 'bg-[#1f150e] border-[#b8860b]/30'}`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className={`font-bold flex items-center gap-1.5 ${isGrave ? 'text-purple-200' : 'text-amber-200'}`}>
                                                            <span>{tavern.sign}</span>
                                                            <span>{tavern.name}</span>
                                                        </span>
                                                        {isConquered ? (
                                                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/50">
                                                                <CheckCircle2 className="w-3 h-3" /> {isGrave ? 'Очищено' : 'Підкорено'}
                                                            </span>
                                                        ) : (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isGrave ? 'bg-purple-950 text-purple-300 border-purple-500/50' : 'bg-amber-950 text-amber-400 border-amber-600/50'}`}>
                                                                Рівень {tavern.tierLevel || 1}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-[11px] text-[#b8a898] line-clamp-2">
                                                        {tavern.atmosphere}
                                                    </p>

                                                    <div className="flex justify-between items-center pt-1 border-t border-[#b8860b]/20 text-[10px]">
                                                        <span className="text-[#a89988]">{isGrave ? 'Монстрів-нежиті:' : 'Супротивників:'} {(tavern?.contenders || []).length}</span>
                                                        <button
                                                            onClick={() => onEnterSettlement(selectedSettlement)}
                                                            className="text-amber-300 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                                                        >
                                                            {isGrave ? 'Бій з нежиттю' : 'Грати в картки'} <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Sub-settlements Section if City */}
                                {subSettlementsOfSelected.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-[#b8860b]/30">
                                        <h3 className="font-serif font-black text-amber-300 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                                            <Building2 className="w-3.5 h-3.5 text-amber-400" />
                                            Околиці та Землі ({subSettlementsOfSelected.length})
                                        </h3>

                                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-[#b8860b]/40">
                                            {subSettlementsOfSelected.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => {
                                                        setSelectedSettlement(sub);
                                                        movePlayerTo(sub.x, sub.y, false, sub);
                                                    }}
                                                    className="w-full text-left bg-[#1a120b] hover:bg-[#2e1d10] p-2 rounded border border-[#b8860b]/20 flex justify-between items-center transition cursor-pointer"
                                                >
                                                    <span className="font-bold text-[#e6d7c3] text-[11px] flex items-center gap-1.5">
                                                        <span>{sub.type === 'castle' ? '🛡️' : sub.type === 'village' ? '🏘️' : sub.type === 'hamlet' ? '🏡' : sub.type === 'graveyard' ? '🪦' : '🏛️'}</span>
                                                        <span>{sub.name}</span>
                                                    </span>
                                                    <ChevronRight className="w-3 h-3 text-amber-400" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Tactical Minimap Radar */}
            <AnimatePresence>
                {showMinimap && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute bottom-6 right-6 z-30 w-44 h-28 sm:w-56 sm:h-36 bg-[#140e0a]/95 border-2 border-[#b8860b]/80 rounded-lg shadow-2xl overflow-hidden backdrop-blur-md flex flex-col pointer-events-auto"
                    >
                        <div className="px-2 py-1 bg-[#221811] border-b border-[#b8860b]/40 flex justify-between items-center text-[10px] font-bold text-amber-300">
                            <span className="flex items-center gap-1">
                                <Compass className="w-3 h-3 text-amber-400" /> Радар Світу (Елдрія)
                            </span>
                            <button onClick={() => setShowMinimap(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
                        </div>
                        <div 
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const cx = ((e.clientX - rect.left) / rect.width) * 100;
                                const cy = ((e.clientY - rect.top) / rect.height) * 100;
                                centerOnCoords(cx, cy);
                            }}
                            className="flex-1 relative bg-[#0b121e] overflow-hidden cursor-pointer"
                        >
                            <img 
                                src={worldMapImg} 
                                alt="Minimap" 
                                className="absolute inset-0 w-full h-full object-cover opacity-60"
                            />
                            {/* City dots on radar */}
                            {WORLD_SETTLEMENTS.filter(s => s.type === 'city').map(s => (
                                <div
                                    key={`mini-${s.id}`}
                                    style={{ left: `${s.x}%`, top: `${s.y}%` }}
                                    className="absolute w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 border border-amber-300"
                                />
                            ))}
                            {/* Monster Squad dots on radar */}
                            {localSquads.map(ms => (
                                <div
                                    key={`mini-monster-${ms.id}`}
                                    style={{ left: `${ms.x}%`, top: `${ms.y}%` }}
                                    className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 border border-white shadow-[0_0_6px_#ef4444]"
                                    title={ms.name}
                                />
                            ))}
                            {/* Wandering Gambler dots on radar */}
                            {localGamblers.map(g => (
                                <div
                                    key={`mini-gambler-${g.id}`}
                                    style={{ left: `${g.x}%`, top: `${g.y}%`, backgroundColor: g.themeColor }}
                                    className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-white shadow-[0_0_5px_rgba(234,179,8,0.8)]"
                                    title={`${g.name} (${g.gameName})`}
                                />
                            ))}
                            {/* Hero marker on radar */}
                            <div
                                style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
                                className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_8px_#f59e0b] flex items-center justify-center pointer-events-none"
                            >
                                <div className="w-1 h-1 rounded-full bg-white" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chasing Squad Alert Banner */}
            <AnimatePresence>
                {chasingSquadNotice && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-2 border-red-500 text-red-100 px-5 py-2 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.85)] backdrop-blur-md flex items-center gap-3 text-xs font-black tracking-wide"
                    >
                        <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse shrink-0" />
                        <span>УВАГА! Загін «{chasingSquadNotice.name}» помітив вас і біжить на перехоплення!</span>
                        <button
                            onClick={() => {
                                centerOnCoords(chasingSquadNotice.x, chasingSquadNotice.y);
                                setSelectedMonsterSquad(chasingSquadNotice);
                            }}
                            className="px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold cursor-pointer transition shadow"
                        >
                            Поглянути
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Wandering Monster Squads Overview Modal / Drawer */}
            <AnimatePresence>
                {showMonstersPanel && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-x-4 top-16 bottom-6 sm:inset-auto sm:top-20 sm:right-6 sm:w-[460px] sm:max-h-[80vh] z-40 bg-[#150d09]/95 border-2 border-red-800/80 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.9)] backdrop-blur-md flex flex-col overflow-hidden text-stone-200"
                    >
                        {/* Header */}
                        <div className="p-3.5 bg-gradient-to-r from-[#2c100b] to-[#1c0c08] border-b border-red-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skull className="w-5 h-5 text-red-400" />
                                <div>
                                    <h3 className="text-sm font-black font-serif text-red-200">
                                        Ворожі Банди на Мапі ({localSquads.length})
                                    </h3>
                                    <p className="text-[10px] text-amber-300/80">
                                        Банди бандитів, грабіжників, головорізів та розбійників блукають землями Елдрії
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowMonstersPanel(false)}
                                className="p-1 text-stone-400 hover:text-white rounded hover:bg-red-950/60 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Sub-controls */}
                        <div className="px-3.5 py-2 bg-[#1b100a] border-b border-stone-800 flex items-center justify-between text-[11px]">
                            <label className="flex items-center gap-2 cursor-pointer text-amber-200/90 font-bold select-none">
                                <input
                                    type="checkbox"
                                    checked={showMonsterTrails}
                                    onChange={(e) => setShowMonsterTrails(e.target.checked)}
                                    className="accent-red-600 rounded"
                                />
                                <span>Показувати траєкторії руху загонів</span>
                            </label>
                            <span className="text-[10px] text-stone-400">
                                ⚔️ Зіткнення починає бій
                            </span>
                        </div>

                        {/* Squads List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-red-900/40">
                            {localSquads.map((squad) => {
                                const isChasing = squad.state === 'chasing_player';
                                const isSelected = selectedMonsterSquad?.id === squad.id;

                                return (
                                    <div
                                        key={squad.id}
                                        className={`p-3 rounded-lg border transition ${
                                            isChasing 
                                                ? 'bg-red-950/70 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                                                : isSelected
                                                ? 'bg-[#2a1711] border-amber-500/70'
                                                : 'bg-[#1e130d] border-stone-800 hover:border-red-900/60'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div 
                                                    className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg bg-black/80 shadow-md shrink-0 overflow-hidden"
                                                    style={{ borderColor: squad.themeColor }}
                                                >
                                                    {squad.avatar && (squad.avatar.startsWith('/') || squad.avatar.includes('.jpg') || squad.avatar.includes('.png')) ? (
                                                        <img 
                                                            src={squad.avatar} 
                                                            alt={squad.name} 
                                                            referrerPolicy="no-referrer"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        squad.avatar
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-bold text-xs text-amber-100 font-serif">
                                                            {squad.name}
                                                        </span>
                                                        <span 
                                                            className="text-[9px] font-black px-1.5 py-0.2 rounded text-white shadow"
                                                            style={{ backgroundColor: squad.themeColor }}
                                                        >
                                                            Рів. {squad.level}
                                                        </span>
                                                        {isChasing && (
                                                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-600 text-white animate-pulse">
                                                                ПЕРЕСЛІДУЄ!
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-stone-400">
                                                        Ватажок: <span className="text-amber-300 font-bold">{squad.leader.name}</span> • Склад: {squad.membersCount} істот
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-[10px] text-amber-400 font-mono">
                                                    [{squad.x.toFixed(1)}%, {squad.y.toFixed(1)}%]
                                                </div>
                                                <div className="text-[9px] text-stone-400 capitalize">
                                                    Небезпека: {squad.dangerRating}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Current Goal Box */}
                                        <div className="mt-2 text-[10px] bg-black/50 p-1.5 rounded border border-stone-800 text-stone-300 flex items-center justify-between gap-2">
                                            <span className="truncate">🎯 {squad.currentGoal.description}</span>
                                            <span className="text-amber-400 font-mono text-[9px] shrink-0">
                                                ➔ [{squad.currentGoal.targetX.toFixed(0)}%, {squad.currentGoal.targetY.toFixed(0)}%]
                                            </span>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="mt-2.5 flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedMonsterSquad(squad);
                                                    centerOnCoords(squad.x, squad.y);
                                                }}
                                                className="flex-1 py-1 px-2 rounded bg-[#2c1c14] hover:bg-[#3d271c] text-amber-300 text-[11px] font-bold border border-amber-500/30 flex items-center justify-center gap-1 cursor-pointer transition"
                                            >
                                                <Crosshair className="w-3 h-3 text-amber-400" />
                                                <span>Знайти на мапі</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (onMonsterEncounter) {
                                                        onMonsterEncounter(squad);
                                                    }
                                                }}
                                                className="flex-1 py-1 px-2 rounded bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white text-[11px] font-bold shadow flex items-center justify-center gap-1 cursor-pointer transition"
                                            >
                                                <Swords className="w-3 h-3" />
                                                <span>Атакувати загін!</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Wandering Gamblers Overview Modal / Drawer */}
            <AnimatePresence>
                {showGamblersPanel && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-x-4 top-16 bottom-6 sm:inset-auto sm:top-20 sm:right-6 sm:w-[500px] sm:max-h-[82vh] z-40 bg-[#140e0a]/95 border-2 border-amber-600/80 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.95)] backdrop-blur-md flex flex-col overflow-hidden text-stone-200"
                    >
                        {/* Header */}
                        <div className="p-3.5 bg-gradient-to-r from-[#2e1d0f] via-[#22140a] to-[#1a0f07] border-b border-amber-600/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                                    <Dices className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black font-serif text-amber-200 flex items-center gap-1.5">
                                        Мандрівні Майстри Ігор ({localGamblers.length})
                                    </h3>
                                    <p className="text-[10px] text-amber-300/80">
                                        Окремий мандрівний суперник для кожної гри у світі Елдрії
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowGamblersPanel(false)}
                                className="p-1 text-stone-400 hover:text-white rounded hover:bg-amber-950/60 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Category Filter Bar */}
                        <div className="px-3.5 py-2 bg-[#1a110b] border-b border-stone-800 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none text-[11px]">
                            <div className="flex items-center gap-1">
                                {(
                                    [
                                        { id: 'all', label: 'Всі' },
                                        { id: 'cards', label: '🎴 Карти' },
                                        { id: 'board', label: '♟️ Дошки' },
                                        { id: 'dice', label: '🎲 Кості' },
                                        { id: 'tourney', label: '🏇 Турніри' },
                                        { id: 'martial', label: '⚔️ Бойові' }
                                    ] as const
                                ).map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setGamblerCategoryFilter(cat.id)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition whitespace-nowrap ${
                                            gamblerCategoryFilter === cat.id
                                                ? 'bg-amber-500 text-black font-black shadow'
                                                : 'bg-[#291b12] text-amber-200/80 hover:bg-[#3d2719]'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sub-controls */}
                        <div className="px-3.5 py-1.5 bg-[#170e08] border-b border-stone-800/80 flex items-center justify-between text-[11px]">
                            <label className="flex items-center gap-2 cursor-pointer text-amber-300/90 font-bold select-none">
                                <input
                                    type="checkbox"
                                    checked={showGamblerTrails}
                                    onChange={(e) => setShowGamblerTrails(e.target.checked)}
                                    className="accent-amber-500 rounded"
                                />
                                <span className="text-[10px]">Показувати траєкторії мандрівників</span>
                            </label>
                            <span className="text-[10px] text-stone-400">
                                🎲 Підійдіть або натисніть для гри
                            </span>
                        </div>

                        {/* Gamblers List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-amber-700/40">
                            {localGamblers
                                .filter(g => {
                                    if (gamblerCategoryFilter === 'all') return true;
                                    const cards: Array<typeof g.gameType> = ['classic_durak_36', 'classic_durak_52', 'rpg_cards', 'french_tarot', 'blackjack'];
                                    const board: Array<typeof g.gameType> = ['checkers', 'senet', 'ur', 'mehen', 'aseb', 'chess_standard', 'shatranj'];
                                    const dice: Array<typeof g.gameType> = ['blackjack_dice', 'dice_poker', 'tavern_dice'];
                                    const tourney: Array<typeof g.gameType> = ['steeplechase', 'archery', 'jousting'];
                                    const martial: Array<typeof g.gameType> = ['brawl', 'fencing'];

                                    if (gamblerCategoryFilter === 'cards') return cards.includes(g.gameType);
                                    if (gamblerCategoryFilter === 'board') return board.includes(g.gameType);
                                    if (gamblerCategoryFilter === 'dice') return dice.includes(g.gameType);
                                    if (gamblerCategoryFilter === 'tourney') return tourney.includes(g.gameType);
                                    if (gamblerCategoryFilter === 'martial') return martial.includes(g.gameType);
                                    return true;
                                })
                                .map((gambler) => {
                                    const isSelected = selectedGambler?.id === gambler.id;

                                    return (
                                        <div
                                            key={gambler.id}
                                            className={`p-3 rounded-lg border transition ${
                                                isSelected
                                                    ? 'bg-[#2b1c11] border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                                    : 'bg-[#1b120c] border-stone-800 hover:border-amber-700/60'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div 
                                                        className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl bg-black/80 shadow-md shrink-0 relative"
                                                        style={{ borderColor: gambler.themeColor }}
                                                    >
                                                        {gambler.avatar}
                                                        <div 
                                                            className="absolute -bottom-1 -right-1 text-[9px] w-4 h-4 rounded-full flex items-center justify-center text-white border border-black shadow"
                                                            style={{ backgroundColor: gambler.themeColor }}
                                                        >
                                                            {gambler.badgeIcon}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-xs text-amber-100 font-serif">
                                                                {gambler.name}
                                                            </span>
                                                            <span 
                                                                className="text-[9px] font-black px-1.5 py-0.2 rounded text-white shadow"
                                                                style={{ backgroundColor: gambler.themeColor }}
                                                            >
                                                                {gambler.gameName}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-amber-300/80 font-medium">
                                                            {gambler.title} • <span className="text-stone-300 capitalize">{gambler.opponent.difficulty}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-[10px] text-amber-400 font-mono">
                                                        [{gambler.x.toFixed(1)}%, {gambler.y.toFixed(1)}%]
                                                    </div>
                                                    <div className="text-[9px] text-stone-400">
                                                        Ставка: {gambler.minBet}–{gambler.maxBet} 🪙
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Current Goal Box */}
                                            <div className="mt-2 text-[10px] bg-black/50 p-1.5 rounded border border-stone-800 text-stone-300 flex items-center justify-between gap-2">
                                                <span className="truncate">🎯 {gambler.currentGoal.description}</span>
                                                <span className="text-amber-400 font-mono text-[9px] shrink-0">
                                                    ➔ [{gambler.currentGoal.targetX.toFixed(0)}%, {gambler.currentGoal.targetY.toFixed(0)}%]
                                                </span>
                                            </div>

                                            {/* Action buttons */}
                                            <div className="mt-2.5 flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedGambler(gambler);
                                                        centerOnCoords(gambler.x, gambler.y);
                                                    }}
                                                    className="flex-1 py-1 px-2 rounded bg-[#2c1d12] hover:bg-[#3d2719] text-amber-300 text-[11px] font-bold border border-amber-600/40 flex items-center justify-center gap-1 cursor-pointer transition"
                                                >
                                                    <Crosshair className="w-3 h-3 text-amber-400" />
                                                    <span>Знайти на мапі</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (onGamblerEncounter) {
                                                            onGamblerEncounter(gambler);
                                                        }
                                                    }}
                                                    className="flex-1 py-1 px-2 rounded bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black text-[11px] font-black shadow flex items-center justify-center gap-1 cursor-pointer transition"
                                                >
                                                    <Dices className="w-3.5 h-3.5" />
                                                    <span>Кинути виклик!</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Caravan Battle / Ambush Notification */}
            <AnimatePresence>
                {caravanCombatNotice && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.9 }}
                        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-45 px-4 py-2.5 rounded-xl bg-red-950/95 border-2 border-red-500 shadow-2xl text-red-100 text-xs sm:text-sm font-black flex items-center gap-2 backdrop-blur-md"
                    >
                        <span className="text-xl animate-bounce">⚔️</span>
                        <span>{caravanCombatNotice}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Caravan Details & Auto-Combat Inspector Modal */}
            <CaravanDetailsModal
                caravan={selectedCaravan}
                isOpen={!!selectedCaravan}
                onClose={() => setSelectedCaravan(null)}
                progress={progress}
                onClaimPayout={(caravan) => {
                    const result = collectCaravanPayout(caravan, progress);
                    onUpdateProgress(result.updatedProgress);
                    setSelectedCaravan(null);
                }}
            />

            {/* Comprehensive Class & Spell Guidebook Modal */}
            <ClassGuidebookModal
                isOpen={showClassGuideModal}
                onClose={() => setShowClassGuideModal(false)}
            />
        </div>
    );
}

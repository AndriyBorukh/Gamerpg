// UR: The Royal Game - Authentic Rulebook Engine (Freecompany d.o.o. 2025 Edition)

export type UrPlayer = 'player' | 'opponent';

export type DieTip = 'blank' | 'silver' | 'gold';

export interface UrDie {
    tip: DieTip;
}

export type TileType = 
    | 'fort'                 // 4 Forts (Rosettes) - Earth L, Earth R, Heaven L, Heaven R
    | 'ishtar'               // Tile of Ishtar (Protects player's pieces on Forts)
    | 'marduk'               // Tile of Marduk (Bridge tile closest to Heaven)
    | 'royal_realm'          // 3 Royal Realm tiles (central Earth)
    | 'entrance'             // Lesser Realm Entrance (2 tiles)
    | 'dots'                 // 5 Circles / Dots (2 tiles)
    | 'eyes'                 // 4 Eyes (2 tiles)
    | 'cornucopia'           // Ріг Достатку (Horn of Plenty / Sacred Amphora)
    | 'vases'                // Two Vases / Urns (Bridge & Heaven)
    | 'warriors'             // 4 Figures / Warriors (Heaven center)
    | 'trees';               // Sacred Trees / Garden (Heaven 2 tiles)

export interface UrTile {
    id: string;
    type: TileType;
    name: string;
    section: 'earth' | 'bridge' | 'heaven';
    r: number; // Row 0..7 (vertical layout)
    c: number; // Col 0..2
    label: string;
    isFort: boolean;
    description: string;
}

export interface UrPiece {
    id: string;
    owner: UrPlayer;
    tileId: string | null; // null = in reserve pool
}

// 20 Tiles of the authentic board
export const UR_TILES: UrTile[] = [
    // --- EARTH SECTION (3x4 = 12 tiles) ---
    // Row 0 (Bottom of Earth)
    { id: 'earth_fort_l', type: 'fort', name: 'Форт Землі (Західний)', section: 'earth', r: 0, c: 0, label: 'Форт', isFort: true, description: 'Розетка. Дарує повторний кидок. Частина панування над Землею.' },
    { id: 'royal_realm_3', type: 'royal_realm', name: 'Царське Царство: Ламассу', section: 'earth', r: 0, c: 1, label: 'Царство', isFort: false, description: 'Царське царство. Сюди можна виставити фішку при кидку Золото + Срібло.' },
    { id: 'earth_fort_r', type: 'fort', name: 'Форт Землі (Східний)', section: 'earth', r: 0, c: 2, label: 'Форт', isFort: true, description: 'Розетка. Дарує повторний кидок. Частина панування над Землею.' },

    // Row 1
    { id: 'earth_eyes_l', type: 'eyes', name: 'Чотири Ока (Захід)', section: 'earth', r: 1, c: 0, label: 'Очі', isFort: false, description: 'Священні очі спостереження на Землі.' },
    { id: 'royal_realm_2', type: 'royal_realm', name: 'Царське Царство: Крилатий Бик', section: 'earth', r: 1, c: 1, label: 'Царство', isFort: false, description: 'Царське царство. Сюди можна виставити фішку при кидку Золото + Срібло.' },
    { id: 'earth_eyes_r', type: 'eyes', name: 'Чотири Ока (Схід)', section: 'earth', r: 1, c: 2, label: 'Очі', isFort: false, description: 'Священні очі спостереження на Землі.' },

    // Row 2
    { id: 'earth_dots_l', type: 'dots', name: 'П’ять Кіл (Захід)', section: 'earth', r: 2, c: 0, label: 'Кола', isFort: false, description: 'П’ять священних сфер плодючості.' },
    { id: 'royal_realm_1', type: 'royal_realm', name: 'Царське Царство: Священний Лев', section: 'earth', r: 2, c: 1, label: 'Царство', isFort: false, description: 'Царське царство. Сюди можна виставити фішку при кидку Золото + Срібло.' },
    { id: 'earth_dots_r', type: 'dots', name: 'П’ять Кіл (Схід)', section: 'earth', r: 2, c: 2, label: 'Кола', isFort: false, description: 'П’ять священних сфер плодючості.' },

    // Row 3
    { id: 'entrance_l', type: 'entrance', name: 'Вхід Малого Царства (Захід)', section: 'earth', r: 3, c: 0, label: 'Вхід', isFort: false, description: 'Сюди завжди можна ввести нову фішку замість інших дій!' },
    { id: 'tile_ishtar', type: 'ishtar', name: 'Тайл Іштар', section: 'earth', r: 3, c: 1, label: 'Іштар', isFort: false, description: 'Цариця Небес. Доки ваша фішка тут, ваші фішки на Фортах у повній безпеці від збиття! Сюди виставляються за 2 Срібла.' },
    { id: 'entrance_r', type: 'entrance', name: 'Вхід Малого Царства (Схід)', section: 'earth', r: 3, c: 2, label: 'Вхід', isFort: false, description: 'Сюди завжди можна ввести нову фішку замість інших дій!' },

    // --- BRIDGE SECTION (1x2 = 2 tiles) ---
    // Row 4
    { id: 'bridge_vases', type: 'cornucopia', name: 'Ріг Достатку Мосту', section: 'bridge', r: 4, c: 1, label: 'Ріг Достатку', isFort: false, description: 'Священний ріг та амфора достатку на мосту між Небом та Землею. Приносить +15 Золота!' },
    // Row 5
    { id: 'tile_marduk', type: 'marduk', name: 'Тайл Мардука', section: 'bridge', r: 5, c: 1, label: 'Мардук', isFort: false, description: 'Владика богів. Дозволяє виставити фішку найдалі на мосту. Спавн за 2 Золота.' },

    // --- HEAVEN SECTION (3x2 = 6 tiles) ---
    // Row 6
    { id: 'heaven_fort_l', type: 'fort', name: 'Форт Небес (Західний)', section: 'heaven', r: 6, c: 0, label: 'Форт', isFort: true, description: 'Розетка. Дарує повторний кидок. Частина панування над Небом.' },
    { id: 'heaven_warriors', type: 'warriors', name: 'Чотири Небесні Воїни', section: 'heaven', r: 6, c: 1, label: 'Воїни', isFort: false, description: 'Чотири духи-охоронці небесного престолу.' },
    { id: 'heaven_fort_r', type: 'fort', name: 'Форт Небес (Східний)', section: 'heaven', r: 6, c: 2, label: 'Форт', isFort: true, description: 'Розетка. Дарує повторний кидок. Частина панування над Небом.' },

    // Row 7 (Top of Heaven)
    { id: 'heaven_trees_l', type: 'trees', name: 'Небесні Сади (Захід)', section: 'heaven', r: 7, c: 0, label: 'Сади', isFort: false, description: 'Древо життя та вічнозелені сади безсмертних богів.' },
    { id: 'heaven_vases', type: 'cornucopia', name: 'Небесний Ріг Достатку', section: 'heaven', r: 7, c: 1, label: 'Ріг Достатку', isFort: false, description: 'Верховний ріг божественного достатку у вершині Небес. Приносить +25 Золота!' },
    { id: 'heaven_trees_r', type: 'trees', name: 'Небесні Сади (Схід)', section: 'heaven', r: 7, c: 2, label: 'Сади', isFort: false, description: 'Древо життя та вічнозелені сади безсмертних богів.' },
];

export const TILE_MAP: Record<string, UrTile> = UR_TILES.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
}, {} as Record<string, UrTile>);

// Adjacency graph representing movement paths on the board (can move forward or backward along connected tiles)
export const TILE_ADJACENCY: Record<string, string[]> = {
    // Left Earth lane
    'entrance_l': ['earth_dots_l', 'tile_ishtar'],
    'earth_dots_l': ['entrance_l', 'earth_eyes_l'],
    'earth_eyes_l': ['earth_dots_l', 'earth_fort_l'],
    'earth_fort_l': ['earth_eyes_l', 'royal_realm_3'],

    // Right Earth lane
    'entrance_r': ['earth_dots_r', 'tile_ishtar'],
    'earth_dots_r': ['entrance_r', 'earth_eyes_r'],
    'earth_eyes_r': ['earth_dots_r', 'earth_fort_r'],
    'earth_fort_r': ['earth_eyes_r', 'royal_realm_3'],

    // Central Earth lane (Royal Realm & Ishtar)
    'royal_realm_3': ['earth_fort_l', 'earth_fort_r', 'royal_realm_2'],
    'royal_realm_2': ['royal_realm_3', 'royal_realm_1'],
    'royal_realm_1': ['royal_realm_2', 'tile_ishtar'],
    'tile_ishtar': ['royal_realm_1', 'bridge_vases', 'entrance_l', 'entrance_r'],

    // Bridge
    'bridge_vases': ['tile_ishtar', 'tile_marduk'],
    'tile_marduk': ['bridge_vases', 'heaven_warriors'],

    // Heaven
    'heaven_warriors': ['tile_marduk', 'heaven_fort_l', 'heaven_fort_r', 'heaven_vases'],
    'heaven_fort_l': ['heaven_warriors', 'heaven_trees_l'],
    'heaven_trees_l': ['heaven_fort_l', 'heaven_vases'],
    'heaven_vases': ['heaven_warriors', 'heaven_trees_l', 'heaven_trees_r'],
    'heaven_trees_r': ['heaven_vases', 'heaven_fort_r'],
    'heaven_fort_r': ['heaven_trees_r', 'heaven_warriors']
};

export const TOTAL_PIECES = 7;

export function createInitialPieces(): UrPiece[] {
    const pieces: UrPiece[] = [];
    for (let i = 1; i <= TOTAL_PIECES; i++) {
        pieces.push({ id: `p_${i}`, owner: 'player', tileId: null });
        pieces.push({ id: `o_${i}`, owner: 'opponent', tileId: null });
    }
    return pieces;
}

// 4 Forts list
export const FORT_IDS = ['earth_fort_l', 'earth_fort_r', 'heaven_fort_l', 'heaven_fort_r'];
export const EARTH_FORT_IDS = ['earth_fort_l', 'earth_fort_r'];
export const HEAVEN_FORT_IDS = ['heaven_fort_l', 'heaven_fort_r'];
export const ROYAL_REALM_IDS = ['royal_realm_1', 'royal_realm_2', 'royal_realm_3'];

// Roll combinations:
// 2 D4 dice with 1 Gold, 1 Silver, 2 Blank tips each
export interface RollOutcome {
    dice: [DieTip, DieTip];
    type: 'double_blank' | 'single_color' | 'gold_silver' | 'double_silver' | 'double_gold';
    movementPoints: number; // 0, 1, or 2 (or 3 if dominating heaven)
    canSpawnAdjacent: boolean;   // Blank + Blank
    canSpawnRoyalRealm: boolean; // Gold + Silver
    canSpawnIshtar: boolean;     // Silver + Silver
    canSpawnMarduk: boolean;     // Gold + Gold
    description: string;
}

export function evaluateRoll(d1: DieTip, d2: DieTip, dominatesHeaven: boolean = false): RollOutcome {
    const tips = [d1, d2];
    const blanks = tips.filter(t => t === 'blank').length;
    const silvers = tips.filter(t => t === 'silver').length;
    const golds = tips.filter(t => t === 'gold').length;

    if (blanks === 2) {
        return {
            dice: [d1, d2],
            type: 'double_blank',
            movementPoints: 0,
            canSpawnAdjacent: true,
            canSpawnRoyalRealm: false,
            canSpawnIshtar: false,
            canSpawnMarduk: false,
            description: 'Два порожніх кінчики! Дозволяє виставити фішку поруч зі своєю. Рухатися не можна.'
        };
    }

    if (blanks === 1) {
        return {
            dice: [d1, d2],
            type: 'single_color',
            movementPoints: 1,
            canSpawnAdjacent: false,
            canSpawnRoyalRealm: false,
            canSpawnIshtar: false,
            canSpawnMarduk: false,
            description: '1 кольоровий кінчик: рух 1 фішки на 1 тайл.'
        };
    }

    // 2 coloured tips:
    if (golds === 1 && silvers === 1) {
        return {
            dice: [d1, d2],
            type: 'gold_silver',
            movementPoints: 2,
            canSpawnAdjacent: false,
            canSpawnRoyalRealm: true,
            canSpawnIshtar: false,
            canSpawnMarduk: false,
            description: 'Золото + Срібло: рух на 2 тайли АБО виставлення у Царське Царство.'
        };
    }

    if (silvers === 2) {
        return {
            dice: [d1, d2],
            type: 'double_silver',
            movementPoints: dominatesHeaven ? 3 : 2,
            canSpawnAdjacent: false,
            canSpawnRoyalRealm: false,
            canSpawnIshtar: true,
            canSpawnMarduk: false,
            description: dominatesHeaven 
                ? '2 Срібла (Панування над Небом!): рух на 3 тайли АБО виставлення на Тайл Іштар.'
                : '2 Срібла: рух на 2 тайли АБО виставлення на Тайл Іштар.'
        };
    }

    // golds === 2
    return {
        dice: [d1, d2],
        type: 'double_gold',
        movementPoints: dominatesHeaven ? 3 : 2,
        canSpawnAdjacent: false,
        canSpawnRoyalRealm: false,
        canSpawnIshtar: false,
        canSpawnMarduk: true,
        description: dominatesHeaven
            ? '2 Золота (Панування над Небом!): рух на 3 тайли АБО виставлення на Тайл Мардука.'
            : '2 Золота: рух на 2 тайли АБО виставлення на Тайл Мардука.'
    };
}

export function rollD4Tip(): DieTip {
    const r = Math.random();
    if (r < 0.25) return 'gold';
    if (r < 0.50) return 'silver';
    return 'blank'; // 50% blank tips (2 blank out of 4)
}

// Check if player has piece on Ishtar
export function hasPieceOnIshtar(pieces: UrPiece[], player: UrPlayer): boolean {
    return pieces.some(p => p.owner === player && p.tileId === 'tile_ishtar');
}

// Check if a piece on a Fort is protected by Ishtar
export function isPieceProtectedByIshtar(pieces: UrPiece[], targetPiece: UrPiece): boolean {
    if (!targetPiece.tileId) return false;
    const tile = TILE_MAP[targetPiece.tileId];
    if (!tile || !tile.isFort) return false;
    return hasPieceOnIshtar(pieces, targetPiece.owner);
}

// Check Earth Domination (controls both Earth Forts)
export function dominatesEarth(pieces: UrPiece[], player: UrPlayer): boolean {
    const held = EARTH_FORT_IDS.filter(fId => 
        pieces.some(p => p.owner === player && p.tileId === fId)
    );
    return held.length === 2;
}

// Check Heaven Domination (controls both Heaven Forts)
export function dominatesHeaven(pieces: UrPiece[], player: UrPlayer): boolean {
    const held = HEAVEN_FORT_IDS.filter(fId => 
        pieces.some(p => p.owner === player && p.tileId === fId)
    );
    return held.length === 2;
}

// Check Ultimate Victory (holds all 4 Forts simultaneously)
export function dominatesBoth(pieces: UrPiece[], player: UrPlayer): boolean {
    const held = FORT_IDS.filter(fId => 
        pieces.some(p => p.owner === player && p.tileId === fId)
    );
    return held.length === 4;
}

// Find tiles reachable in exactly N steps from startTileId
// Rulebook:
// - A piece may not move over an opponent's piece, but it can defeat it if it moves onto the same tile.
// - You cannot have 2 pieces on the same tile (friendly pieces cannot land together).
// - You may move over your other (friendly) piece.
// - Movement ends if an enemy piece is defeated, UNLESS the player dominates Earth.
export function getReachableTiles(
    pieces: UrPiece[],
    movingPiece: UrPiece,
    steps: number,
    earthDominated: boolean
): string[] {
    if (!movingPiece.tileId || steps <= 0) return [];

    interface SearchState {
        tileId: string;
        remainingSteps: number;
        visited: string[];
    }

    const destinations = new Set<string>();
    const queue: SearchState[] = [{
        tileId: movingPiece.tileId,
        remainingSteps: steps,
        visited: [movingPiece.tileId]
    }];

    while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.remainingSteps === 0) {
            // Check landing legality:
            // Cannot land on friendly piece
            const friendlyAtTarget = pieces.some(
                p => p.owner === movingPiece.owner && p.id !== movingPiece.id && p.tileId === current.tileId
            );
            if (!friendlyAtTarget) {
                // If enemy at target, check Ishtar protection
                const enemyAtTarget = pieces.find(
                    p => p.owner !== movingPiece.owner && p.tileId === current.tileId
                );
                if (enemyAtTarget) {
                    if (!isPieceProtectedByIshtar(pieces, enemyAtTarget)) {
                        destinations.add(current.tileId);
                    }
                } else {
                    destinations.add(current.tileId);
                }
            }
            continue;
        }

        const neighbors = TILE_ADJACENCY[current.tileId] || [];
        for (const nextTile of neighbors) {
            // Avoid immediate backtracking in the same path branch
            if (current.visited.length >= 2 && current.visited[current.visited.length - 2] === nextTile) {
                continue;
            }

            const enemyOnNext = pieces.find(
                p => p.owner !== movingPiece.owner && p.tileId === nextTile
            );

            if (enemyOnNext) {
                // Cannot pass over enemy piece! Can only move onto it to defeat it.
                if (current.remainingSteps === 1 || earthDominated) {
                    // Allowed to move onto enemy piece to defeat it
                    if (!isPieceProtectedByIshtar(pieces, enemyOnNext)) {
                        if (current.remainingSteps === 1) {
                            destinations.add(nextTile);
                        } else if (earthDominated) {
                            // Earth domination allows continuing through defeated enemy!
                            queue.push({
                                tileId: nextTile,
                                remainingSteps: current.remainingSteps - 1,
                                visited: [...current.visited, nextTile]
                            });
                        }
                    }
                }
                // Cannot leap over enemy if not 1 step and not dominating earth
                continue;
            }

            // Can pass through empty tile or friendly tile
            queue.push({
                tileId: nextTile,
                remainingSteps: current.remainingSteps - 1,
                visited: [...current.visited, nextTile]
            });
        }
    }

    return Array.from(destinations);
}

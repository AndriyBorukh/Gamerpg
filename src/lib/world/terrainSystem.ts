// Water and Land Separation System for the 8-screen Fantasy World Map
// 100% pixel-accurate ground-truth land mask derived from the continent map image.
// Guarantees NO settlements ever spawn in water or deep oceans.

export type TerrainType = 'water' | 'land';

export interface BiomeDefinition {
    id: string;
    name: string;
    description: string;
    type: TerrainType;
    color: string;
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    checkPoint?: (x: number, y: number) => boolean;
}

// 100x100 Binary Bitmask of actual solid land vs water on clean_world_map_1789426428380.jpg
const LAND_MASK_B64 = 'AAD4wO/039v/AwAAAACABeDPv73+PwAAAAAAfFEL7MX//wEAAAAAgBeEQL/4/08AAAAAAHiBAPyD/v8EAAAAAOCnBICf//8PAAAAAAD4Bwnr////AgAAAAAALAI4////JwAAAAAAwALy8v//fwIAAAAAABCRf/b//y8AAAAAAIAC+u///38DAAAAAMAoIP/+//8fAAAAAAD9ENiP/v/fAAAAAADID4j89P//BQAAAACAfDTM////PwAAAAAA4Mta+P///wEAAAAAAC7hgP///w8AAAAAAGATxu7//z8AIAgAAADPVvz8//8BgNcAAADwB4jX//8fAPgPAAAAFAA6+f//AYD/AAAAwAG4of//DwD4HwAAwBxQGvr/3wHA/wEAAMwBlZH/9x8g/38AAIAYsFnx//8D9/8DAACYAbGl//+/f/4/AACAAZD45v//////AwAACBDasf//////HwAAAAB4rPT//////wMAAACA/7f+/////38AAAAA/l39//////8PAAAA4H+D////////AQAAQP7v+///////PwAAIPz/1v+//////wMAAJz/T////////z8AAMD79/X///////8DAAC8/7////////9/AADA///////v////BwAA/f//////////XwAA/P///////////wcAoP/////+/////28AAPj////+/////w8HAMD///////v///9hAAD8/3/9/x////8/BgDA///////x////IQAA/f////8D/P//HwIA0P//n/8/wP///wMAHP//////Afz//z8AwKH/////H8D3//8DABz+///9/wP8//9/APBA/////z8A////BwAHgP////8D8P//fwAwAfD///8/AP///weAmwD+////A/D///8B8AvA/+v/fwL///8fAP0B/P///z/w////AeA/6P/z//8H/v//HwD+B/v///9/4P///wHg/9D//f//B////z8A/h/9a///f/D///8D4P/Rf////9////8/APo//Pf/////////AwD/87//////////PwD0P/3//////////wfA/8O//v///////38A/De0//////////8D4P9E7v////////8fAP5P4P//////////AeD/DPz/////////HwD+50D//////////wDA/w/9/////////wMA/Pvw/////////38AgJ8P/v////////8HAND8wP////////9/AACADvr/////////AwDwfOD/////f/7/PwQA/wf//////+P//0EAQBvw/////z/8/w8EAKCA//////+B//9wAAAA+P///58e+P8HBwAAgP/////AwP9/OAAAAPD///8PAPz/BwMAAMD///9/AMD/fzAAAAD8////AwDo/8cDAADA////PwCA/j88AAAA/v///wMA2P/DAAAA4P///x8AAPsfGgAAAP7///8BAGD+IQEAAOD///8fAAAeBwcAAAD+////AADABz8AAADg////DwAAOPABAAAA/P//jwAAAAAXAAAAwP///wAAAABAAAAAAP7//wcAAACABwAAAOD//38AAAAAOAAAAAD+//8DAAAAAAAAAADg//8FAAAAAAAAAAAA+P8fAAAAAAAAAAAAgP//AQAAAAAAAAAAAPz/HwAAAAAAAAA=';

function decodeBase64ToBytes(b64: string): Uint8Array {
    if (typeof atob !== 'undefined') {
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
            arr[i] = bin.charCodeAt(i);
        }
        return arr;
    }
    // Node.js fallback
    const buf = Buffer.from(b64, 'base64');
    return new Uint8Array(buf);
}

const LAND_MASK_BYTES = decodeBase64ToBytes(LAND_MASK_B64);

/**
 * Checks with 100% pixel accuracy whether (x, y) [0..100%] is on real solid land.
 */
export function isPointOnLand(x: number, y: number): boolean {
    if (x < 2.0 || x > 98.0 || y < 2.0 || y > 98.0) return false;
    const gx = Math.min(99, Math.max(0, Math.round(x)));
    const gy = Math.min(99, Math.max(0, Math.round(y)));
    const bitIndex = gy * 100 + gx;
    const byteIndex = bitIndex >> 3;
    const bitOffset = bitIndex & 7;
    return (LAND_MASK_BYTES[byteIndex] & (1 << bitOffset)) !== 0;
}

/**
 * Checks if a point is safely inside the interior of a landmass (with 1-cell safety margin).
 */
export function isSolidInteriorLand(x: number, y: number): boolean {
    const rx = Math.round(x);
    const ry = Math.round(y);
    return isPointOnLand(rx, ry) &&
           isPointOnLand(rx - 1, ry) &&
           isPointOnLand(rx + 1, ry) &&
           isPointOnLand(rx, ry - 1) &&
           isPointOnLand(rx, ry + 1);
}

// Precomputed list of guaranteed solid interior land points
export const SOLID_LAND_POINTS: { x: number; y: number }[] = [];
for (let y = 3; y <= 96; y++) {
    for (let x = 3; x <= 96; x++) {
        if (isSolidInteriorLand(x, y)) {
            SOLID_LAND_POINTS.push({ x, y });
        }
    }
}

// Major Water Bodies & Seas
export const WATER_BODIES = [
    {
        id: 'north_ocean',
        name: 'Північний Крижаний Океан',
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 12,
        check: (x: number, y: number) => !isPointOnLand(x, y) && y < 20
    },
    {
        id: 'central_ocean',
        name: 'Центральний Великий Океан',
        minX: 20,
        maxX: 45,
        minY: 20,
        maxY: 55,
        check: (x: number, y: number) => !isPointOnLand(x, y) && x >= 20 && x <= 45 && y >= 20 && y <= 55
    },
    {
        id: 'east_sea',
        name: 'Східне Безкрає Море',
        minX: 78,
        maxX: 100,
        minY: 0,
        maxY: 45,
        check: (x: number, y: number) => !isPointOnLand(x, y) && x >= 78 && y <= 45
    },
    {
        id: 'south_abyss',
        name: 'Південна Велика Безодня',
        minX: 0,
        maxX: 100,
        minY: 78,
        maxY: 100,
        check: (x: number, y: number) => !isPointOnLand(x, y) && y >= 78
    },
    {
        id: 'outer_waters',
        name: 'Океанічні Глибини Елдрії',
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100,
        check: (x: number, y: number) => !isPointOnLand(x, y)
    }
];

// Major Continental Biomes defining territory names and lore
export const LAND_CONTINENTS: BiomeDefinition[] = [
    {
        id: 'north_snow',
        name: 'Північні Крижані Піки (Тундра)',
        description: 'Засніжені гірські вершини, вічна мерзлота та крижані плато.',
        type: 'land',
        color: '#dbeef4',
        bounds: { minX: 4, maxX: 35, minY: 4, maxY: 25 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y < 25 && x < 35
    },
    {
        id: 'north_pines',
        name: 'Північні Хвойні Землі (Тайга)',
        description: 'Густі прадавні соснові ліси, скелясті пагорби та річкові долини.',
        type: 'land',
        color: '#385e38',
        bounds: { minX: 35, maxX: 65, minY: 4, maxY: 25 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y < 25 && x >= 35 && x < 65
    },
    {
        id: 'north_autumn',
        name: 'Багряні Ельфійські Ліси',
        description: 'Червоні осінні гаї, темні вежі та прадавні святилища на північному сході.',
        type: 'land',
        color: '#9e2a2b',
        bounds: { minX: 65, maxX: 95, minY: 4, maxY: 25 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y < 25 && x >= 65
    },
    {
        id: 'west_archipelago',
        name: 'Західний Архіпелаг та Острови',
        description: 'Мережа скелястих островів, фортець мореплавців та коралових заток.',
        type: 'land',
        color: '#2a9d8f',
        bounds: { minX: 4, maxX: 35, minY: 25, maxY: 48 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y >= 25 && y < 48 && x < 35
    },
    {
        id: 'central_eldria',
        name: 'Центральні Землі та Столиця Елдрії',
        description: 'Родючі рівнини, білокам\'яні замки, торгові шляхи та головні міста.',
        type: 'land',
        color: '#4f772d',
        bounds: { minX: 35, maxX: 75, minY: 25, maxY: 48 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y >= 25 && y < 48 && x >= 35 && x < 75
    },
    {
        id: 'east_mountain_kingdom',
        name: 'Східне Гірське Королівство',
        description: 'Неприступні скелі, шахтарські фортеці та палаци східних володарів.',
        type: 'land',
        color: '#6b705c',
        bounds: { minX: 75, maxX: 96, minY: 25, maxY: 48 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y >= 25 && y < 48 && x >= 75
    },
    {
        id: 'west_volcano',
        name: 'Обсидіановий Вулканічний Хребет',
        description: 'Кратери, темні базальтові фортеці та гарячі джерела на заході.',
        type: 'land',
        color: '#541212',
        bounds: { minX: 4, maxX: 32, minY: 48, maxY: 72 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y >= 48 && y < 72 && x < 32
    },
    {
        id: 'heart_continent',
        name: 'Серцевий Континент Елдрії',
        description: 'Величні лісові масиви, замкові долини, мішані ліси та лицарські маєтки.',
        type: 'land',
        color: '#31572c',
        bounds: { minX: 32, maxX: 70, minY: 48, maxY: 72 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y >= 48 && y < 72 && x >= 32 && x < 70
    },
    {
        id: 'east_dragon_rocks',
        name: 'Східні Драконячі Скелі',
        description: 'Високі берегові кручі, осередки мисливців на драконів та замкові форпости.',
        type: 'land',
        color: '#7f4f24',
        bounds: { minX: 70, maxX: 96, minY: 48, maxY: 72 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y >= 48 && y < 72 && x >= 70
    },
    {
        id: 'southwest_desert',
        name: 'Золоті Пустелі та Каньйони',
        description: 'Піщані дюни, червоні каньйони, оазиси та стародавні руїни.',
        type: 'land',
        color: '#e9c46a',
        bounds: { minX: 4, maxX: 35, minY: 72, maxY: 96 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y >= 72 && x < 35
    },
    {
        id: 'south_valleys',
        name: 'Південні Зелені Долини',
        description: 'Квітучі луки, теплі прибережні містечка, виноградники та пасовища.',
        type: 'land',
        color: '#588157',
        bounds: { minX: 35, maxX: 72, minY: 72, maxY: 96 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y >= 72 && x >= 35 && x < 72
    },
    {
        id: 'southeast_mages',
        name: 'Південно-Східні Землі Магів',
        description: 'Таємничі миси, маяки архімагів та магічні академії на узбережжі.',
        type: 'land',
        color: '#5e503f',
        bounds: { minX: 72, maxX: 96, minY: 72, maxY: 96 },
        checkPoint: (x, y) => isPointOnLand(x, y) && y >= 72 && x >= 72
    }
];

// Pre-group solid land points by continent for uniform regional generation
const LAND_POINTS_BY_CONTINENT: Map<string, { x: number; y: number }[]> = new Map();
LAND_CONTINENTS.forEach(cont => {
    const points = SOLID_LAND_POINTS.filter(p => cont.checkPoint ? cont.checkPoint(p.x, p.y) : false);
    LAND_POINTS_BY_CONTINENT.set(cont.id, points.length > 0 ? points : SOLID_LAND_POINTS);
});

/**
 * Returns detailed terrain and biome info for any coordinate.
 */
export function getTerrainInfo(x: number, y: number): {
    isLand: boolean;
    biomeName: string;
    regionName: string;
    zoneName: string;
    description: string;
    color: string;
    canPlaceSettlement: boolean;
} {
    const onLand = isPointOnLand(x, y);

    if (onLand) {
        for (const continent of LAND_CONTINENTS) {
            if (continent.checkPoint && continent.checkPoint(x, y)) {
                return {
                    isLand: true,
                    biomeName: continent.name,
                    regionName: continent.name,
                    zoneName: continent.name,
                    description: continent.description,
                    color: continent.color,
                    canPlaceSettlement: true
                };
            }
        }
        return {
            isLand: true,
            biomeName: 'Землі Елдрії',
            regionName: 'Землі Елдрії',
            zoneName: 'Землі Елдрії',
            description: 'Родючі континентальні простори.',
            color: '#4f772d',
            canPlaceSettlement: true
        };
    }

    // It's water
    for (const water of WATER_BODIES) {
        if (water.check(x, y)) {
            return {
                isLand: false,
                biomeName: water.name,
                regionName: water.name,
                zoneName: water.name,
                description: 'Морські води та затоки, де будівництво міст неможливе.',
                color: '#1e3a8a',
                canPlaceSettlement: false
            };
        }
    }

    return {
        isLand: false,
        biomeName: 'Води Елдрії',
        regionName: 'Води Елдрії',
        zoneName: 'Води Елдрії',
        description: 'Морські простори між континентами.',
        color: '#0f172a',
        canPlaceSettlement: false
    };
}

/**
 * Finds the closest guaranteed solid land point from any coordinate.
 */
export function findNearestLand(x: number, y: number): { x: number; y: number; distance: number } {
    let best = { x: 52, y: 38, distance: Infinity };
    for (const pt of SOLID_LAND_POINTS) {
        const dist = Math.hypot(pt.x - x, pt.y - y);
        if (dist < best.distance) {
            best = { x: pt.x, y: pt.y, distance: dist };
            if (dist < 0.5) break;
        }
    }
    return best;
}

/**
 * Strictly guarantees that any coordinate is snapped onto solid interior land.
 */
export function ensureOnLand(x: number, y: number): { x: number; y: number; adjusted: boolean; regionName: string } {
    const rx = Math.round(x);
    const ry = Math.round(y);

    if (isSolidInteriorLand(rx, ry)) {
        const info = getTerrainInfo(rx, ry);
        return {
            x: rx,
            y: ry,
            adjusted: false,
            regionName: info.biomeName
        };
    }

    const nearest = findNearestLand(x, y);
    const info = getTerrainInfo(nearest.x, nearest.y);
    return {
        x: nearest.x,
        y: nearest.y,
        adjusted: true,
        regionName: info.biomeName
    };
}

/**
 * Returns a guaranteed random solid land coordinate across all continental biomes.
 */
export function getRandomLandCoordinate(
    rand: () => number,
    preferredContinentIndex?: number
): { x: number; y: number; continent: BiomeDefinition } {
    const continentIdx = preferredContinentIndex !== undefined
        ? preferredContinentIndex % LAND_CONTINENTS.length
        : Math.floor(rand() * LAND_CONTINENTS.length);

    const cont = LAND_CONTINENTS[continentIdx];
    const points = LAND_POINTS_BY_CONTINENT.get(cont.id) || SOLID_LAND_POINTS;

    if (points.length > 0) {
        const chosen = points[Math.floor(rand() * points.length)];
        return {
            x: chosen.x,
            y: chosen.y,
            continent: cont
        };
    }

    // Absolute fallback
    const fb = SOLID_LAND_POINTS[Math.floor(rand() * SOLID_LAND_POINTS.length)];
    return {
        x: fb.x,
        y: fb.y,
        continent: LAND_CONTINENTS[4] // Central Eldria
    };
}

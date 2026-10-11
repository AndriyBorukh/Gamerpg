import { SettlementData, WorldProgress, HiredCompanion, TradeCaravan, TradeCaravanGuard, TradeCaravanCargo, CaravanCombatState } from '../types';
import { WORLD_SETTLEMENTS } from './worldData';
import { GUILD_COMMODITY_CATEGORIES, CommodityCategory, CommoditySubGood, getCommodityMarketPrice } from './tradeGuildData';

// Potential ambush threats along trade roads
const AMBUSH_THREATS = [
    { name: 'Банда лісових розбійників', type: 'bandits' as const, icon: '🗡️', hp: 120, armor: 10, strength: 18 },
    { name: 'Зграя диких вовкулаків', type: 'monsters' as const, icon: '🐺', hp: 95, armor: 5, strength: 16 },
    { name: 'Загін дезертирів-мародерів', type: 'bandits' as const, icon: '🪓', hp: 140, armor: 15, strength: 22 },
    { name: 'Гобліни-грабіжники караванів', type: 'monsters' as const, icon: '👺', hp: 80, armor: 4, strength: 14 },
    { name: 'Культисти Чорного Тіньовика', type: 'cultists' as const, icon: '🧙‍♂️', hp: 110, armor: 8, strength: 24 },
    { name: 'Степові грабіжники', type: 'raiders' as const, icon: '🐎', hp: 150, armor: 14, strength: 20 },
    { name: 'Печерні тролі з узбіччя', type: 'monsters' as const, icon: '🧌', hp: 190, armor: 18, strength: 26 }
];

// Pick a random destination city different from origin
export function pickRandomTradeDestination(originCityId: string): SettlementData {
    const validDestinations = WORLD_SETTLEMENTS.filter(s => 
        s.id !== originCityId && (s.type === 'city' || s.type === 'castle' || s.type === 'village')
    );
    if (validDestinations.length === 0) return WORLD_SETTLEMENTS[0];
    return validDestinations[Math.floor(Math.random() * validDestinations.length)];
}

// Generate default guild guards (NPC mercenaries hired by the guild)
export function generateGuildMercenaryGuards(count: number = 2): TradeCaravanGuard[] {
    const mercenaryPool = [
        { name: 'Олекса Заброцький', title: 'Ветеран-мечник', avatar: '⚔️', hp: 80, armor: 12, strength: 16 },
        { name: 'Юрко Скороход', title: 'Арбалетник гільдії', avatar: '🏹', hp: 65, armor: 8, strength: 18 },
        { name: 'Михайло Дуб', title: 'Кований щитоносець', avatar: '🛡️', hp: 100, armor: 20, strength: 14 },
        { name: 'Гриць Блискавка', title: 'Кінний розвідник', avatar: '🐎', hp: 75, armor: 10, strength: 15 }
    ];

    const guards: TradeCaravanGuard[] = [];
    for (let i = 0; i < count; i++) {
        const merc = mercenaryPool[i % mercenaryPool.length];
        guards.push({
            id: `merc_${Date.now()}_${i}`,
            name: merc.name,
            avatar: merc.avatar,
            title: merc.title,
            isPlayerCompanion: false,
            hp: merc.hp,
            maxHp: merc.hp,
            armor: merc.armor,
            strength: merc.strength,
            rewardGold: 0,
            rewardXp: 0
        });
    }
    return guards;
}

// Convert a player companion into a caravan guard
export function companionToCaravanGuard(companion: HiredCompanion, rewardGold: number = 100, rewardXp: number = 60): TradeCaravanGuard {
    const baseHp = companion.hp || 100;
    const armor = companion.armor || 10;
    const strength = (companion.strength || 15) + (companion.level || 1) * 2;

    return {
        id: `guard_comp_${companion.id}`,
        name: companion.name,
        avatar: companion.avatar || '⚔️',
        title: companion.title || 'Союзник-охоронець',
        companionId: companion.id,
        isPlayerCompanion: true,
        hp: baseHp,
        maxHp: baseHp,
        armor: armor,
        strength: strength,
        rewardGold,
        rewardXp
    };
}

// Create a trade caravan when the player invests in goods at the merchant guild
export function createTradeCaravanFromInvestment(
    originSettlement: SettlementData,
    category: CommodityCategory,
    good: CommoditySubGood,
    unitsCount: number,
    totalInvestedGold: number,
    timeSeed: number,
    playerCompanionGuards: HiredCompanion[] = []
): TradeCaravan {
    const destination = pickRandomTradeDestination(originSettlement.id);
    
    // Calculate market price multiplier at destination (with arbitrage bonus 15% - 50%)
    const originMarket = getCommodityMarketPrice(originSettlement.id, good, category, timeSeed);
    const destMarket = getCommodityMarketPrice(destination.id, good, category, timeSeed + 2);
    
    // Profit multiplier
    const rawMultiplier = Math.max(1.25, (destMarket.currentPrice / Math.max(1, originMarket.currentPrice)) * 1.15);
    const expectedSellPricePerUnit = Math.round(originMarket.currentPrice * rawMultiplier);
    const totalExpectedProfit = Math.round(unitsCount * (expectedSellPricePerUnit - originMarket.currentPrice));

    // Player invested good
    const playerCargo: TradeCaravanCargo = {
        categoryId: category.id,
        categoryName: category.name,
        goodId: good.id,
        goodName: good.name,
        icon: good.icon,
        units: unitsCount,
        unitName: good.unitName,
        investedGold: totalInvestedGold,
        buyPrice: originMarket.currentPrice,
        targetSellPrice: expectedSellPricePerUnit,
        isPlayerGood: true
    };

    // Add 1-2 random secondary city guild goods carried by the convoy
    const secondaryGoods: TradeCaravanCargo[] = [];
    const otherCategories = GUILD_COMMODITY_CATEGORIES.filter(c => c.id !== category.id);
    if (otherCategories.length > 0) {
        const randomCat = otherCategories[Math.floor(Math.random() * otherCategories.length)];
        const randomGood = randomCat.goods[Math.floor(Math.random() * randomCat.goods.length)];
        const secUnits = Math.floor(Math.random() * 8) + 3;
        secondaryGoods.push({
            categoryId: randomCat.id,
            categoryName: randomCat.name,
            goodId: randomGood.id,
            goodName: randomGood.name,
            icon: randomGood.icon,
            units: secUnits,
            unitName: randomGood.unitName,
            investedGold: secUnits * randomGood.basePrice,
            buyPrice: randomGood.basePrice,
            targetSellPrice: Math.round(randomGood.basePrice * 1.3),
            isPlayerGood: false
        });
    }

    // Prepare guards (mercenaries + player companions)
    const guards: TradeCaravanGuard[] = [];
    
    // Add player companions
    playerCompanionGuards.forEach(comp => {
        const fee = Math.max(50, Math.round(totalInvestedGold * 0.12) + (comp.level || 1) * 20);
        guards.push(companionToCaravanGuard(comp, fee, 80));
    });

    // Add 1-2 standard guild mercenaries if player provided fewer than 2 companions
    if (guards.length < 2) {
        const needCount = 2 - guards.length;
        guards.push(...generateGuildMercenaryGuards(needCount));
    }

    const totalGuardHp = guards.reduce((acc, g) => acc + g.hp, 0);
    const maxCaravanHp = 200 + totalGuardHp;

    const caravanId = `caravan_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
        id: caravanId,
        name: `Торговий обоз: «${originSettlement.name} ➔ ${destination.name}»`,
        originCityId: originSettlement.id,
        originCityName: originSettlement.name,
        originPos: { x: originSettlement.x, y: originSettlement.y },
        destinationCityId: destination.id,
        destinationCityName: destination.name,
        destinationPos: { x: destination.x, y: destination.y },
        currentPos: { x: originSettlement.x, y: originSettlement.y },
        goods: [playerCargo, ...secondaryGoods],
        status: 'traveling_to_destination',
        progress: 0,
        phase: 'outbound',
        guards,
        caravanHp: maxCaravanHp,
        maxCaravanHp,
        combatState: null,
        combatHistoryLogs: [
            `📜 [00:00] Караван успішно споряджено у місті ${originSettlement.name}. Завантажено: ${good.icon} ${good.name} (${unitsCount} ${good.unitName}). Охорона готова до поїздки!`
        ],
        totalInvestedGold,
        totalExpectedProfit,
        playerPayoutGold: totalInvestedGold + totalExpectedProfit,
        playerPayoutXp: Math.max(50, Math.round(totalInvestedGold * 0.15)),
        isPlayerCaravan: true,
        speed: 0.045, // Moves across map smoothly
        createdTimestamp: Date.now()
    };
}

// Generate ambient NPC trade caravans
export function generateInitialWorldCaravans(): TradeCaravan[] {
    const cities = WORLD_SETTLEMENTS.filter(s => s.type === 'city' || s.type === 'castle');
    if (cities.length < 2) return [];

    const caravans: TradeCaravan[] = [];
    const samplePairs = [
        [0, 1],
        [1, 2],
        [2, 0]
    ];

    samplePairs.forEach(([idxA, idxB], i) => {
        const cityA = cities[idxA % cities.length];
        const cityB = cities[idxB % cities.length];
        if (!cityA || !cityB || cityA.id === cityB.id) return;

        const cat = GUILD_COMMODITY_CATEGORIES[i % GUILD_COMMODITY_CATEGORIES.length];
        const good = cat.goods[0];
        const units = 10;
        const invested = units * good.basePrice;

        const guards = generateGuildMercenaryGuards(2);
        const maxHp = 200 + guards.reduce((acc, g) => acc + g.hp, 0);

        caravans.push({
            id: `npc_caravan_${i + 1}`,
            name: `Купецький караван «${cityA.name} ➔ ${cityB.name}»`,
            originCityId: cityA.id,
            originCityName: cityA.name,
            originPos: { x: cityA.x, y: cityA.y },
            destinationCityId: cityB.id,
            destinationCityName: cityB.name,
            destinationPos: { x: cityB.x, y: cityB.y },
            currentPos: { 
                x: cityA.x + (cityB.x - cityA.x) * (0.2 + i * 0.3),
                y: cityA.y + (cityB.y - cityA.y) * (0.2 + i * 0.3)
            },
            goods: [{
                categoryId: cat.id,
                categoryName: cat.name,
                goodId: good.id,
                goodName: good.name,
                icon: good.icon,
                units,
                unitName: good.unitName,
                investedGold: invested,
                buyPrice: good.basePrice,
                targetSellPrice: Math.round(good.basePrice * 1.3),
                isPlayerGood: false
            }],
            status: 'traveling_to_destination',
            progress: 0.2 + i * 0.3,
            phase: 'outbound',
            guards,
            caravanHp: maxHp,
            maxCaravanHp: maxHp,
            combatState: null,
            combatHistoryLogs: [`📜 [Торгівля] Купецький караван вирушив з міста ${cityA.name} до ${cityB.name}.`],
            totalInvestedGold: invested,
            totalExpectedProfit: Math.round(invested * 0.35),
            playerPayoutGold: 0,
            playerPayoutXp: 0,
            isPlayerCaravan: false,
            speed: 0.035,
            createdTimestamp: Date.now()
        });
    });

    return caravans;
}

export interface CaravanUpdateResult {
    updatedCaravans: TradeCaravan[];
    completedPlayerCaravans: TradeCaravan[];
    combatAlerts: { caravan: TradeCaravan; message: string }[];
}

// Step / update all active caravans on the world map
export function updateWorldCaravans(
    caravans: TradeCaravan[],
    dtSeconds: number = 0.4
): CaravanUpdateResult {
    const completedPlayerCaravans: TradeCaravan[] = [];
    const combatAlerts: { caravan: TradeCaravan; message: string }[] = [];

    const updatedCaravans = caravans.map(caravan => {
        // If already completed or destroyed, skip
        if (caravan.status === 'completed' || caravan.status === 'plundered') {
            return caravan;
        }

        let updated: TradeCaravan = { ...caravan };

        // 1. If currently in combat, execute auto-combat round
        if (updated.status === 'in_combat' && updated.combatState) {
            const combat = { ...updated.combatState };
            combat.round += 1;

            // Total guard attack
            const totalGuardStrength = updated.guards.reduce((acc, g) => acc + (g.strength || 12), 0);
            const totalGuardArmor = updated.guards.reduce((acc, g) => acc + (g.armor || 5), 0);

            // Guard damage to enemy
            const guardDamage = Math.max(8, Math.round(totalGuardStrength * (0.8 + Math.random() * 0.4) - combat.opponentArmor * 0.4));
            combat.opponentHp = Math.max(0, combat.opponentHp - guardDamage);

            // Enemy damage to caravan / guards
            const enemyDamage = Math.max(5, Math.round(combat.opponentStrength * (0.8 + Math.random() * 0.4) - (totalGuardArmor * 0.25)));
            combat.caravanHp = Math.max(0, combat.caravanHp - enemyDamage);
            updated.caravanHp = combat.caravanHp;

            const roundLog = `⚔️ Раунд ${combat.round}: Охорона завдала ${guardDamage} шкоди ворогу (${combat.opponentHp}/${combat.opponentMaxHp} HP). Вороги відповіли ${enemyDamage} шкоди обозу (${combat.caravanHp}/${combat.caravanMaxHp} HP)!`;
            combat.combatLogs = [roundLog, ...combat.combatLogs.slice(0, 8)];

            // Check combat outcome
            if (combat.opponentHp <= 0) {
                // Guards won!
                combat.isResolved = true;
                combat.isGuardsVictorious = true;
                const winLog = `🏆 [Перемога в автобою!] Охорона вщент розбила ворожий загін «${combat.opponentSquadName}»! Караван продовжив свій шлях без втрат вантажу!`;
                updated.combatHistoryLogs = [winLog, ...updated.combatHistoryLogs.slice(0, 15)];
                updated.combatState = null;
                updated.status = updated.phase === 'outbound' ? 'traveling_to_destination' : 'returning_to_origin';
            } else if (combat.caravanHp <= 0) {
                // Caravan plundered / damaged
                combat.isResolved = true;
                combat.isGuardsVictorious = false;
                const plunderLog = `⚠️ [Напад розбійників!] Загін «${combat.opponentSquadName}» пошкодив обоз. Частина вантажу втрачена, але охоронці відбили залишки і продовжують рух!`;
                updated.combatHistoryLogs = [plunderLog, ...updated.combatHistoryLogs.slice(0, 15)];
                updated.caravanHp = Math.round(updated.maxCaravanHp * 0.4);
                updated.totalExpectedProfit = Math.max(0, Math.round(updated.totalExpectedProfit * 0.6));
                updated.combatState = null;
                updated.status = updated.phase === 'outbound' ? 'traveling_to_destination' : 'returning_to_origin';
            } else {
                updated.combatState = combat;
            }

            return updated;
        }

        // 2. Movement along the road
        const stepProgress = (updated.speed * dtSeconds) / 4; // Normalized movement speed
        updated.progress = Math.min(1, updated.progress + stepProgress);

        if (updated.phase === 'outbound') {
            // Move from origin to destination
            const startX = updated.originPos.x;
            const startY = updated.originPos.y;
            const endX = updated.destinationPos.x;
            const endY = updated.destinationPos.y;

            updated.currentPos = {
                x: startX + (endX - startX) * updated.progress,
                y: startY + (endY - startY) * updated.progress
            };

            // Check if reached destination
            if (updated.progress >= 1) {
                updated.status = 'trading_at_destination';
                updated.phase = 'inbound';
                updated.progress = 0;
                const tradeLog = `💰 [Торгова угода в ${updated.destinationCityName}] Товари успішно продано на місцевій міській біржі за вигідним курсом! Караван завантажив виручку та вирушає назад до ${updated.originCityName}!`;
                updated.combatHistoryLogs = [tradeLog, ...updated.combatHistoryLogs.slice(0, 15)];
            } else {
                // Random ambush trigger along outbound route (approx 1.5% chance per tick in wild zones)
                if (Math.random() < 0.015 && !updated.combatState) {
                    const threat = AMBUSH_THREATS[Math.floor(Math.random() * AMBUSH_THREATS.length)];
                    const combatState: CaravanCombatState = {
                        opponentSquadName: threat.name,
                        opponentType: threat.type,
                        opponentIcon: threat.icon,
                        opponentHp: threat.hp,
                        opponentMaxHp: threat.hp,
                        opponentArmor: threat.armor,
                        opponentStrength: threat.strength,
                        caravanHp: updated.caravanHp,
                        caravanMaxHp: updated.maxCaravanHp,
                        round: 0,
                        combatLogs: [`🚨 На караван на дорозі напав ворожий загін: ${threat.icon} ${threat.name}! Розпочався автобій охорони!`],
                        isResolved: false
                    };
                    updated.status = 'in_combat';
                    updated.combatState = combatState;
                    combatAlerts.push({
                        caravan: updated,
                        message: `На ваш караван «${updated.name}» напали: ${threat.icon} ${threat.name}!`
                    });
                }
            }
        } else if (updated.phase === 'inbound') {
            // Move from destination back to origin
            const startX = updated.destinationPos.x;
            const startY = updated.destinationPos.y;
            const endX = updated.originPos.x;
            const endY = updated.originPos.y;

            updated.currentPos = {
                x: startX + (endX - startX) * updated.progress,
                y: startY + (endY - startY) * updated.progress
            };

            // Check if returned back to origin
            if (updated.progress >= 1) {
                updated.status = 'completed';
                const returnLog = `🎉 [Повернення додому] Караван урочисто повернувся до рідного міста ${updated.originCityName}! Золото та прибуток готові до виплати! Союзники-охоронці відпочивають у міській таверні!`;
                updated.combatHistoryLogs = [returnLog, ...updated.combatHistoryLogs.slice(0, 15)];
                if (updated.isPlayerCaravan) {
                    completedPlayerCaravans.push(updated);
                }
            } else {
                // Random ambush trigger along inbound route
                if (Math.random() < 0.012 && !updated.combatState) {
                    const threat = AMBUSH_THREATS[Math.floor(Math.random() * AMBUSH_THREATS.length)];
                    const combatState: CaravanCombatState = {
                        opponentSquadName: threat.name,
                        opponentType: threat.type,
                        opponentIcon: threat.icon,
                        opponentHp: threat.hp,
                        opponentMaxHp: threat.hp,
                        opponentArmor: threat.armor,
                        opponentStrength: threat.strength,
                        caravanHp: updated.caravanHp,
                        caravanMaxHp: updated.maxCaravanHp,
                        round: 0,
                        combatLogs: [`🚨 На зворотному шляху на караван напали: ${threat.icon} ${threat.name}! Охорона вступила в бій!`],
                        isResolved: false
                    };
                    updated.status = 'in_combat';
                    updated.combatState = combatState;
                    combatAlerts.push({
                        caravan: updated,
                        message: `На ваш караван «${updated.name}» на зворотному шляху напали: ${threat.icon} ${threat.name}!`
                    });
                }
            }
        }

        return updated;
    });

    return {
        updatedCaravans,
        completedPlayerCaravans,
        combatAlerts
    };
}

// Collect payout from completed caravan and return companions to tavern
export function collectCaravanPayout(
    caravan: TradeCaravan,
    progress: WorldProgress
): { updatedProgress: WorldProgress; payoutGold: number; payoutXp: number; returnedCompanionsCount: number } {
    const payoutGold = caravan.playerPayoutGold || (caravan.totalInvestedGold + caravan.totalExpectedProfit);
    const payoutXp = caravan.playerPayoutXp || 60;

    let companionCount = 0;
    const updatedHiredNpcs = (progress.hiredNpcs || []).map(comp => {
        // Check if this companion was guarding the caravan
        const isThisGuard = caravan.guards.some(g => g.companionId === comp.id);
        if (isThisGuard) {
            companionCount += 1;
            const guardReward = caravan.guards.find(g => g.companionId === comp.id)?.rewardGold || 80;
            return {
                ...comp,
                isGuardingCaravan: false,
                currentCaravanId: undefined,
                restingInTavernSettlementId: caravan.originCityId,
                guardRewardEarned: (comp.guardRewardEarned || 0) + guardReward,
                xp: (comp.xp || 0) + 75
            };
        }
        return comp;
    });

    const updatedActiveCaravans = (progress.activeCaravans || []).filter(c => c.id !== caravan.id);
    const updatedHistory = [caravan, ...(progress.completedCaravansHistory || []).slice(0, 20)];

    const updatedProgress: WorldProgress = {
        ...progress,
        playerGold: (progress.playerGold || 0) + payoutGold,
        guildTotalProfit: (progress.guildTotalProfit || 0) + (caravan.totalExpectedProfit || 0),
        guildReputation: (progress.guildReputation || 0) + 120,
        playerStats: {
            ...progress.playerStats,
            xp: (progress.playerStats?.xp || 0) + payoutXp
        },
        hiredNpcs: updatedHiredNpcs,
        activeCaravans: updatedActiveCaravans,
        completedCaravansHistory: updatedHistory
    };

    return {
        updatedProgress,
        payoutGold,
        payoutXp,
        returnedCompanionsCount: companionCount
    };
}

import { useState, useEffect, useCallback, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Suit, TablePair, Player, CombatLogEntry, ShopStock, SettlementData, TavernData, OpponentData, WorldProgress, TavernActivityType } from './types';
import { 
    canBeat, 
    canAttackWithCard, 
    SENIOR_SUIT,
    canPlayerMakeMove,
    DeckMode,
    isInstantSpellCard,
    getRequiredEternalDiscardCount,
    createDeck
} from './lib/gameLogic';
import { 
    GameState, 
    INITIAL_SHOP_STOCK, 
    initGame, 
    playCardAndLog, 
    passTurnState, 
    takeCardsState, 
    finishBoutState, 
    buyShopItemState, 
    runBotTurn,
    addLog,
    pickSmeltingCardState
} from './lib/gameEngine';
import { loadWorldProgress, saveWorldProgress, recordVictory, recordLoss, getOpponentWinCount, getOpponentXpReward,  WORLD_SETTLEMENTS, resetWorldProgress, ensureTavernOpponents } from './lib/worldData';
import { playSparkleSound, playGoldSound, playLevelUpSound } from './lib/soundEffects';
import { CardView } from './components/CardView';
import { OpponentView } from './components/OpponentView';
import { PlayerCountModal } from './components/PlayerCountModal';
import { ShopModal } from './components/ShopModal';
import { TutorialModal } from './components/TutorialModal';
import { SmeltingPickerModal } from './components/SmeltingPickerModal';
import { CombatLogView } from './components/CombatLogView';
import { WorldMapView } from './components/WorldMapView';
import { SettlementModal } from './components/SettlementModal';
import { TavernModal } from './components/TavernModal';
import { DeckBuilderModal } from './components/DeckBuilderModal';
import { DuelResultModal } from './components/DuelResultModal';
import { BrawlArenaModal } from './components/BrawlArenaModal';
import { FencingArenaModal } from './components/FencingArenaModal';
import { CharacterStatsModal } from './components/CharacterStatsModal';
import ClassicDurakModal, { DurakGameMode } from './components/ClassicDurakModal';
import DicePokerModal from './components/DicePokerModal';
import TavernDiceModal from './components/TavernDiceModal';
import CoinTossModal from './components/CoinTossModal';
import D20DiceModal from './components/D20DiceModal';
import PotionRouletteModal from './components/PotionRouletteModal';
import TavernLabyrinthModal from './components/TavernLabyrinthModal';
import TavernTreasureHunterModal from './components/TavernTreasureHunterModal';
import DiceDuelModal from './components/DiceDuelModal';
import DiceTournamentModal from './components/DiceTournamentModal';
import CheckersModal from './components/CheckersModal';
import SenetModal from './components/SenetModal';
import UrModal from './components/UrModal';
import MehenModal from './components/MehenModal';
import AsebModal from './components/AsebModal';
import ChessModal, { GameVariant } from './components/ChessModal';
import { FrenchTarotModal } from './components/FrenchTarotModal';
import { BlackjackModal } from './components/BlackjackModal';
import { BlackjackDiceModal } from './components/BlackjackDiceModal';
import { HorseRaceModal } from './components/HorseRaceModal';
import { BettingModal } from './components/BettingModal';
import ArcheryModal from './components/ArcheryModal';
import JoustingModal from './components/JoustingModal';
import ToySoldiersModal from './components/ToySoldiersModal';
import { ArmyBattleModal } from './components/ArmyBattleModal';
import { CheckersWarModal } from './components/CheckersWarModal';
import { RpgArmyCheckersModal } from './components/RpgArmyCheckersModal';
import { ToyCheckersModal } from './components/ToyCheckersModal';
import { ToyPawnsModal } from './components/ToyPawnsModal';
import { WizardBattleModal } from './components/WizardBattleModal';
import { MagicPawnsModal } from './components/MagicPawnsModal';
import { BattlePawns6x12Modal } from './components/BattlePawns6x12Modal';
import { FantasyAdventureModal } from './components/FantasyAdventureModal';
import { ToyShopModal } from './components/ToyShopModal';
import { ToyCollectionModal } from './components/ToyCollectionModal';
import { DecompressionMasterModal } from './components/DecompressionMasterModal';
import { CardMasterModal } from './components/CardMasterModal';
import { MonsterEncounterModal } from './components/MonsterEncounterModal';
import { GoldBoxCombatModal } from './components/GoldBoxCombatModal';
import { MonsterSquad, generateInitialWanderingSquads, respawnDefeatedSquad } from './lib/monsters/wanderingMonsters';
import { WanderingGamblerModal } from './components/WanderingGamblerModal';
import { WanderingGambler, generateInitialWanderingGamblers } from './lib/wanderingGamblers';
import { QuestModal } from './components/QuestModal';
import { processQuestEvent, QuestTriggerEvent } from './lib/questSystem';
import { 
    RefreshCw, 
    Hand, 
    Users, 
    Swords, 
    Shield, 
    Award, 
    Coins, 
    CheckCircle2, 
    Lock, 
    Trophy, 
    Frown, 
    ShoppingBag, 
    Zap, 
    BookOpen, 
    Scroll, 
    Radio,
    Wifi,
    WifiOff,
    Map as MapIcon,
    Beer,
    Crown,
    Layers,
    Flame,
    AlertTriangle
} from 'lucide-react';

export default function App() {
    // Solo game state
    const [playerCount, setPlayerCount] = useState<number>(2);
    const [deckMode, setDeckMode] = useState<DeckMode>('extended');
    const [localGameState, setLocalGameState] = useState<GameState>(() => initGame(2, 'extended'));
    
    // World Map & Progression State
    const [activeView, setActiveView] = useState<'world' | 'arena'>('world');
    const [worldProgress, setWorldProgress] = useState<WorldProgress>(() => loadWorldProgress());

    const resetCampaignProgress = useCallback(() => {
        const fresh = resetWorldProgress();
        setWorldProgress(fresh);
        setActiveSettlement(null);
        setActiveTavern(null);
        setCurrentDuel(null);
        setDuelResult(null);
        
        // Reset all active mini-game modals
        setActiveBrawl(null);
        setActiveFencing(null);
        setActiveClassicDurak(null);
        setActiveFrenchTarot(null);
        setActiveBlackjack(null);
        setActiveBlackjackDice(null);
        setActiveHorseRace(null);
        setActiveDicePoker(null);
        setActiveTavernDice(null);
        setActiveCheckers(null);
        setActiveSenet(null);
        setActiveUr(null);
        setActiveMehen(null);
        setActiveAseb(null);
        setActiveArchery(null);
        setActiveJousting(null);
        setActiveChess(null);
    }, []);

    const tryStartGame = useCallback((startFn: () => void, additionalCost: number = 0) => {
        const totalRequired = 10 + additionalCost;
        if (worldProgress.playerGold < totalRequired) {
            setNoGoldError(true);
            return;
        }
        setWorldProgress(prev => {
            const updated = {
                ...prev,
                playerGold: prev.playerGold - 10
            };
            saveWorldProgress(updated);
            return updated;
        });
        startFn();
    }, [worldProgress]);

    const [activeSettlement, setActiveSettlement] = useState<SettlementData | null>(null);
    const [activeTavern, setActiveTavern] = useState<TavernData | null>(null);

    const handleCraftCard = useCallback((card: Card) => {
        const costGold = 25;
        const costPieces = 20;
        if (worldProgress.playerGold < costGold || (worldProgress.cardPieces || 0) < costPieces) return;

        const cardKey = `${card.rank}:${card.suit}`;
        const settlementId = activeSettlement?.id || '';
        const currentCraftedMap = worldProgress.craftedCardsCount || {};
        const settlementCraftedMap = currentCraftedMap[settlementId] || {};
        const cardCraftedCount = settlementCraftedMap[cardKey] || 0;

        if (cardCraftedCount >= 3) return;

        // Create card with unique id
        const newCardInstance = {
            ...card,
            id: Math.floor(Date.now() + Math.random() * 1000000)
        };

        const updatedCraftedMap = {
            ...currentCraftedMap,
            [settlementId]: {
                ...settlementCraftedMap,
                [cardKey]: cardCraftedCount + 1
            }
        };

        const updatedProgress = {
            ...worldProgress,
            playerGold: worldProgress.playerGold - costGold,
            cardPieces: (worldProgress.cardPieces || 0) - costPieces,
            playerRpgCards: [...(worldProgress.playerRpgCards || []), newCardInstance],
            craftedCardsCount: updatedCraftedMap
        };

        setWorldProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
    }, [worldProgress, activeSettlement]);

    const handleSaveDeck = useCallback((newDeck: Card[]) => {
        setWorldProgress(prev => {
            const updated = {
                ...prev,
                playerRpgDeck: newDeck
            };
            saveWorldProgress(updated);
            return updated;
        });
        setIsDeckBuilderOpen(false);
    }, []);

    const [currentDuel, setCurrentDuel] = useState<{
        settlement: SettlementData;
        tavern: TavernData;
        opponent: OpponentData;
        betAmount: number;
    } | null>(null);
    const [duelResult, setDuelResult] = useState<{
        isVictory: boolean;
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        activityType?: TavernActivityType;
        betAmount?: number;
        isTavernNowConquered?: boolean;
        unlockedNextName?: string;
        xpEarned?: number;
        didLevelUp?: boolean;
        newLevel?: number;
        pointsGained?: number;
        winsAgainstOpponent?: number;
        becameNpc?: boolean;
        cardsGained?: Card[];
        cardPiecesGained?: number;
        blankCardsGained?: number;
        discardCountProcessed?: number;
        earnedShopToken?: boolean;
    } | null>(null);

    // Fist Fight (Brawl) State
    const [activeBrawl, setActiveBrawl] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    // Fencing (Sword Fighting) State
    const [activeFencing, setActiveFencing] = useState<{
        mode: 'sword_shield' | 'sword_only';
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    // Wandering Monster Squads State
    const [wanderingSquads, setWanderingSquads] = useState<MonsterSquad[]>(() => generateInitialWanderingSquads());
    const [activeMonsterEncounter, setActiveMonsterEncounter] = useState<MonsterSquad | null>(null);
    const [lastEncounteredSquad, setLastEncounteredSquad] = useState<MonsterSquad | null>(null);
    const [activeSquadTarget, setActiveSquadTarget] = useState<{ type: 'leader' | 'ally'; index?: number } | null>(null);
    const [activeGoldBoxCombat, setActiveGoldBoxCombat] = useState<{
        squad: MonsterSquad;
        preemptiveDamage: number;
    } | null>(null);

    // Wandering Gamblers State
    const [wanderingGamblers, setWanderingGamblers] = useState<WanderingGambler[]>(() => generateInitialWanderingGamblers());
    const [activeWanderingGambler, setActiveWanderingGambler] = useState<WanderingGambler | null>(null);
    const [lastEncounteredGambler, setLastEncounteredGambler] = useState<WanderingGambler | null>(null);
    const [activeGamblerTarget, setActiveGamblerTarget] = useState<{ type: 'leader' | 'ally'; index?: number } | null>(null);

    // Mini-Games States
    const [activeClassicDurak, setActiveClassicDurak] = useState<{
        mode: DurakGameMode;
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeFrenchTarot, setActiveFrenchTarot] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeBlackjack, setActiveBlackjack] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeBlackjackDice, setActiveBlackjackDice] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeHorseRace, setActiveHorseRace] = useState<{
        raceType: 'steeplechase' | 'flat_horse_race' | 'mounted_archery';
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [pendingBetAction, setPendingBetAction] = useState<{
        title: string;
        onConfirm: (bet: number) => void;
    } | null>(null);

    const [activeDicePoker, setActiveDicePoker] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeTavernDice, setActiveTavernDice] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeCoinFlip, setActiveCoinFlip] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeD20Dice, setActiveD20Dice] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activePotionRoulette, setActivePotionRoulette] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeLabyrinth, setActiveLabyrinth] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeTreasureHunter, setActiveTreasureHunter] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeDiceDuel, setActiveDiceDuel] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeDiceDuelTournament, setActiveDiceDuelTournament] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeCheckers, setActiveCheckers] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeSenet, setActiveSenet] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeUr, setActiveUr] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeMehen, setActiveMehen] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeAseb, setActiveAseb] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeArchery, setActiveArchery] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeJousting, setActiveJousting] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeChess, setActiveChess] = useState<{
        variant: GameVariant;
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeToySoldiers, setActiveToySoldiers] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeArmyBattle, setActiveArmyBattle] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeCheckersWar, setActiveCheckersWar] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
        variant?: 'checkers_war' | 'aranian_checkers_war' | 'military_checkers' | 'aranian_military_checkers';
    } | null>(null);

    const [activeRpgArmyCheckers, setActiveRpgArmyCheckers] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeToyCheckers, setActiveToyCheckers] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
        boardSize?: 8 | 10 | 12;
        gameType?: 'toy_checkers' | 'toy_checkers_10x10' | 'toy_checkers_12x12' | 'toy_checkers_classic';
        movementMode?: 'combat' | 'checkers_classic';
    } | null>(null);

    const [activeToyPawns, setActiveToyPawns] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
        boardSize?: 8 | 10 | 12;
        gameType?: 'toy_pawns' | 'toy_pawns_10x10' | 'toy_pawns_12x12';
    } | null>(null);

    const [activeWizardBattle, setActiveWizardBattle] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeWizardTournament, setActiveWizardTournament] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeMagicPawns, setActiveMagicPawns] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
        boardSize?: 8 | 10 | 12;
        gameType?: 'magic_pawns' | 'magic_pawns_10x10' | 'magic_pawns_12x12';
    } | null>(null);

    const [activeBattlePawns6x12, setActiveBattlePawns6x12] = useState<{
        opponent: OpponentData;
        tavern?: TavernData;
        settlement?: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [activeFantasyAdventure, setActiveFantasyAdventure] = useState<{
        opponent: OpponentData;
        tavern: TavernData;
        settlement: SettlementData;
        betAmount?: number;
    } | null>(null);

    const [isToyShopOpen, setIsToyShopOpen] = useState<boolean>(false);
    const [isDecompressionMasterOpen, setIsDecompressionMasterOpen] = useState<boolean>(false);
    const [isCardMasterOpen, setIsCardMasterOpen] = useState<boolean>(false);
    const [isToyCollectionOpen, setIsToyCollectionOpen] = useState<boolean>(false);

    const [isCharacterStatsOpen, setIsCharacterStatsOpen] = useState<boolean>(false);

    // Vampire Spell State
    const [vampireSpellCaster, setVampireSpellCaster] = useState<Card | null>(null);

    // UI Modals
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
    const [noGoldError, setNoGoldError] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
    const [isDeckBuilderOpen, setIsDeckBuilderOpen] = useState<boolean>(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
    const [isLogOpen, setIsLogOpen] = useState<boolean>(true);
    const [isMultiplayerOpen, setIsMultiplayerOpen] = useState<boolean>(false);
    const [isQuestModalOpen, setIsQuestModalOpen] = useState<boolean>(false);
    const [inspectPile, setInspectPile] = useState<'discard' | 'eternal' | 'hero' | 'my_deck' | null>(null);
    const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);

    // Event-driven Quest tracking helper
    const triggerQuestEvent = useCallback((event: QuestTriggerEvent) => {
        setWorldProgress(prev => {
            const { updatedProgress } = processQuestEvent(prev, event);
            saveWorldProgress(updatedProgress);
            return updatedProgress;
        });
    }, []);


    const isMultiplayerActive = false;
    const currentRoom = null;
    const activePlayerId = 0;
    const sendNetworkAction = (action: string, payload?: any) => {};
    const activeGameState = localGameState;
    // Solo game controls
    const startNewGame = useCallback((count: number = playerCount, mode: DeckMode = deckMode) => {
        if (isMultiplayerActive && currentRoom?.players.find(p => p.id === activePlayerId)?.isHost) {
            sendNetworkAction('RESTART_ROOM');
            setIsMultiplayerOpen(true);
            return;
        }

        setLocalGameState(initGame(count, mode));
        setIsSettingsOpen(false);
    }, [playerCount, deckMode, isMultiplayerActive, currentRoom, activePlayerId, sendNetworkAction]);

    // Start duel from tavern
    const handleStartDuel = useCallback((opponent: OpponentData, tavern: TavernData, settlement: SettlementData, betAmount: number = 0) => {
        tryStartGame(() => {
            setCurrentDuel({ settlement, tavern, opponent, betAmount });
            setDuelResult(null);
            setActiveTavern(null);
            setActiveSettlement(null);

            // Per-opponent persistent spell shop stock:
            const oppShopStock = { ...INITIAL_SHOP_STOCK, ...(worldProgress.opponentSpellShops?.[opponent.id] || {}) };

            const activeDeck = (worldProgress.playerRpgDeck && worldProgress.playerRpgDeck.length > 0)
                ? worldProgress.playerRpgDeck
                : (worldProgress.playerRpgCards && worldProgress.playerRpgCards.length > 0 ? worldProgress.playerRpgCards : undefined);

            const newGame = initGame(2, 'extended', undefined, activeDeck);
            // Customize bot player 1 with opponent's name, avatar, and stats
            const customPlayers = newGame.players.map(p => {
                if (p.id === 1) {
                    return {
                        ...p,
                        name: opponent.name,
                        avatar: opponent.avatar,
                        hp: opponent.hp,
                        maxHp: opponent.hp,
                        armor: opponent.armor,
                        maxArmor: opponent.armor,
                        powerPoints: opponent.powerPoints
                    };
                }
                return p;
            });

            setLocalGameState({
                ...newGame,
                shopStock: oppShopStock,
                players: customPlayers,
                statusBanner: `⚔️ Поєдинок у таверні «${tavern.name}» проти ${opponent.title} — ${opponent.name}!`
            });
            setActiveView('arena');
        }, betAmount);
    }, [tryStartGame, worldProgress]);

    // Duel victory / defeat evaluation
    useEffect(() => {
        if (!currentDuel || isMultiplayerActive || !localGameState.gameOver || duelResult) return;

        const isDraw = localGameState.isDraw;
        const human = localGameState.players.find(p => p.id === 0);

        // Human won if bot (id 1) is the fool, or human came out 1st rank
        const isHumanVictory = !isDraw && (
            localGameState.foolPlayerId === 1 ||
            (human?.outRank === 1)
        );

        const discardPile = localGameState.discardPile || [];
        const eternalDiscard = localGameState.eternalDiscardPile || [];
        // Eternal discard cards are torn to pieces: 4 pieces per card
        const eternalPieces = eternalDiscard.length * 4;
        const heroPieces = localGameState.heroShardsGained || 0;
        const piecesGained = eternalPieces + heroPieces;

        // Regular discard cards do NOT return to the player; they immediately merge 4 into 1 blank card
        const totalUnmerged = (worldProgress.unmergedDiscardCount || 0) + discardPile.length;
        const newBlankCards = Math.floor(totalUnmerged / 4);
        const remainingUnmerged = totalUnmerged % 4;

        let cardsGained: Card[] = [];

        const destroyedHeroIds = localGameState.destroyedHeroCardIds || [];
        const heroUpdatesMap = localGameState.heroCardUpdates || {};

        // Calculate actual remaining deck for Player 0 (Human):
        // 1. Un-drawn cards remaining in prikup deck
        const remainingPrikup = (localGameState.prikupDecks?.[0] || localGameState.deck || []).filter(c => !c.heroCardId || !destroyedHeroIds.includes(c.heroCardId));
        // 2. Real cards remaining in hand (excluding temporary 🎲 gamblers and transient spells)
        const remainingHandRealCards = (human?.hand || []).filter(c => !c.isGambler && !c.isSpell && (!c.heroCardId || !destroyedHeroIds.includes(c.heroCardId)));
        // 3. Player's custom hero cards in hero discard pile are preserved (if not destroyed)
        const playerHeroCards = (localGameState.heroDiscardPile || []).filter(c => c.isCustomHeroCard && (!c.heroCardId || !destroyedHeroIds.includes(c.heroCardId)));
        // 4. New persistent deck = remaining prikup + remaining hand + saved hero cards (NO regular discard cards!)
        let updatedPlayerDeck = [...remainingPrikup, ...remainingHandRealCards, ...playerHeroCards];

        // Process Custom Hero Cards (XP, level up, condition and removal of destroyed cards)
        const existingHeroCards = worldProgress.customHeroCards || [];
        let anyHeroLeveledUp = false;
        const updatedHeroCards = existingHeroCards
            .filter(hero => !destroyedHeroIds.includes(hero.id))
            .map(hero => {
                const matchUpdate = heroUpdatesMap[hero.id];
                let lvl = matchUpdate ? matchUpdate.level : hero.level;
                let xp = matchUpdate ? matchUpdate.experience : hero.experience;
                let cond = matchUpdate ? matchUpdate.condition : (hero.condition ?? 10);
                let maxXp = matchUpdate ? matchUpdate.maxXp : (hero.maxXp || ((lvl + 1) * 20));

                if (isHumanVictory) {
                    xp += 35; // Bonus victory XP
                }

                while (xp >= maxXp && lvl < 99) {
                    xp -= maxXp;
                    lvl += 1;
                    maxXp = (lvl + 1) * 20;
                    anyHeroLeveledUp = true;
                }

                return {
                    ...hero,
                    level: lvl,
                    experience: xp,
                    maxXp,
                    condition: cond,
                    maxCondition: 10
                };
            });

        if (anyHeroLeveledUp) {
            playLevelUpSound();
        }

        // Sync Custom Hero Cards level, power value and condition in active deck
        updatedPlayerDeck = updatedPlayerDeck.map(c => {
            if (c.isCustomHeroCard && c.heroCardId) {
                const matchHero = updatedHeroCards.find(h => h.id === c.heroCardId);
                if (matchHero) {
                    return {
                        ...c,
                        heroLevel: matchHero.level,
                        heroXp: matchHero.experience,
                        heroMaxXp: matchHero.maxXp,
                        heroCondition: matchHero.condition,
                        heroMaxCondition: 10,
                        value: matchHero.level
                    };
                }
            }
            return c;
        });

        if (isHumanVictory) {
            // Check if 1st victory against this opponent to award 1 Shop Refresh Token
            const oppId = currentDuel.opponent.id;
            const alreadyAwarded = (worldProgress.rpgShopTokensAwardedOpponentIds || []).includes(oppId);
            let earnedShopToken = false;
            let updatedTokens = worldProgress.shopRefreshTokens || 0;
            let updatedAwardedList = worldProgress.rpgShopTokensAwardedOpponentIds || [];

            if (!alreadyAwarded) {
                earnedShopToken = true;
                updatedTokens += 1;
                updatedAwardedList = [...updatedAwardedList, oppId];
            }

            // Also give the winner 1 random trophy card from the loser
            const fullClassicDeck = createDeck('classic');
            const templateCard = fullClassicDeck[Math.floor(Math.random() * fullClassicDeck.length)];
            const randomCard = {
                ...templateCard,
                id: Math.floor(Date.now() + Math.random() * 1000000)
            };
            cardsGained.push(randomCard);
            updatedPlayerDeck.push(randomCard);

            if (updatedPlayerDeck.length === 0) {
                updatedPlayerDeck = createDeck('classic');
            }

            const outcome = recordVictory(worldProgress, currentDuel.opponent, currentDuel.tavern, false);

            // Sync current opponent's persistent spell shop stock
            const updatedShops = {
                ...(outcome.updatedProgress.opponentSpellShops || {}),
                [oppId]: localGameState.shopStock || INITIAL_SHOP_STOCK
            };

            const updatedWithBet = {
                ...outcome.updatedProgress,
                playerGold: outcome.updatedProgress.playerGold + (currentDuel.betAmount ?? 0),
                playerRpgCards: updatedPlayerDeck,
                playerRpgDeck: updatedPlayerDeck,
                cardPieces: (outcome.updatedProgress.cardPieces || 0) + piecesGained,
                shopRefreshTokens: updatedTokens,
                rpgShopTokensAwardedOpponentIds: updatedAwardedList,
                opponentSpellShops: updatedShops,
                blankCardsCount: (worldProgress.blankCardsCount || 0) + newBlankCards,
                unmergedDiscardCount: remainingUnmerged,
                customHeroCards: updatedHeroCards
            };
            setWorldProgress(updatedWithBet);
            saveWorldProgress(updatedWithBet);
            triggerQuestEvent({
                type: 'duel_won',
                opponentId: currentDuel.opponent.id,
                opponentName: currentDuel.opponent.name
            });
            setDuelResult({
                isVictory: true,
                opponent: currentDuel.opponent,
                tavern: currentDuel.tavern,
                settlement: currentDuel.settlement,
                activityType: 'rpg_cards',
                betAmount: currentDuel.betAmount ?? 0,
                isTavernNowConquered: outcome.isTavernNowConquered,
                unlockedNextName: outcome.unlockedNextName,
                xpEarned: outcome.xpEarned,
                didLevelUp: outcome.didLevelUp,
                newLevel: outcome.newLevel,
                pointsGained: outcome.pointsGained,
                winsAgainstOpponent: outcome.winsAgainstOpponent,
                becameNpc: outcome.becameNpc,
                cardsGained,
                cardPiecesGained: piecesGained,
                blankCardsGained: newBlankCards,
                discardCountProcessed: discardPile.length,
                earnedShopToken
            });
        } else {
            if (updatedPlayerDeck.length === 0) {
                updatedPlayerDeck = createDeck('classic');
            }

            const outcome = recordLoss(worldProgress, false);
            const oppId = currentDuel.opponent.id;
            const updatedShops = {
                ...(outcome.updatedProgress.opponentSpellShops || {}),
                [oppId]: localGameState.shopStock || INITIAL_SHOP_STOCK
            };

            const updatedWithBet = {
                ...outcome.updatedProgress,
                playerGold: Math.max(0, outcome.updatedProgress.playerGold - (currentDuel.betAmount ?? 0)),
                playerRpgCards: updatedPlayerDeck,
                playerRpgDeck: updatedPlayerDeck,
                cardPieces: (outcome.updatedProgress.cardPieces || 0) + piecesGained,
                blankCardsCount: (worldProgress.blankCardsCount || 0) + newBlankCards,
                unmergedDiscardCount: remainingUnmerged,
                customHeroCards: updatedHeroCards,
                opponentSpellShops: updatedShops
            };
            setWorldProgress(updatedWithBet);
            saveWorldProgress(updatedWithBet);
            setDuelResult({
                isVictory: false,
                opponent: currentDuel.opponent,
                tavern: currentDuel.tavern,
                settlement: currentDuel.settlement,
                activityType: 'rpg_cards',
                betAmount: currentDuel.betAmount ?? 0,
                xpEarned: outcome.xpEarned,
                didLevelUp: outcome.didLevelUp,
                newLevel: outcome.newLevel,
                pointsGained: outcome.pointsGained,
                cardsGained: [],
                cardPiecesGained: piecesGained,
                blankCardsGained: newBlankCards,
                discardCountProcessed: discardPile.length
            });
        }
    }, [localGameState.gameOver, currentDuel, duelResult, localGameState.foolPlayerId, localGameState.isDraw, localGameState.players, worldProgress, isMultiplayerActive, localGameState.discardPile, localGameState.eternalDiscardPile, localGameState.shopStock]);

    const handleRematch = useCallback(() => {
        const opponent = duelResult?.opponent || currentDuel?.opponent;
        const tavern = duelResult?.tavern || currentDuel?.tavern;
        const settlement = duelResult?.settlement || currentDuel?.settlement;
        const actType = duelResult?.activityType || 'rpg_cards';
        const bet = duelResult?.betAmount ?? currentDuel?.betAmount ?? 0;

        if (!opponent || !tavern || !settlement) return;

        setDuelResult(null);

        if (actType === 'rpg_cards') {
            handleStartDuel(opponent, tavern, settlement, bet);
        } else if (actType === 'classic_durak_36' || actType === 'durak_36') {
            tryStartGame(() => {
                setActiveClassicDurak({ mode: '36', opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'classic_durak_52' || actType === 'durak_52') {
            tryStartGame(() => {
                setActiveClassicDurak({ mode: '52', opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'french_tarot') {
            tryStartGame(() => {
                setActiveFrenchTarot({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'blackjack') {
            tryStartGame(() => {
                setActiveBlackjack({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'blackjack_dice') {
            tryStartGame(() => {
                setActiveBlackjackDice({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'dice_poker') {
            tryStartGame(() => {
                setActiveDicePoker({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'tavern_dice') {
            tryStartGame(() => {
                setActiveTavernDice({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'coin_flip') {
            tryStartGame(() => {
                setActiveCoinFlip({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'd20_dice') {
            tryStartGame(() => {
                setActiveD20Dice({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'potion_roulette') {
            tryStartGame(() => {
                setActivePotionRoulette({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'dice_duel') {
            tryStartGame(() => {
                setActiveDiceDuel({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'dice_duel_tournament') {
            tryStartGame(() => {
                setActiveDiceDuelTournament({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'checkers') {
            tryStartGame(() => {
                setActiveCheckers({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'senet') {
            tryStartGame(() => {
                setActiveSenet({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'ur') {
            tryStartGame(() => {
                setActiveUr({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'mehen') {
            tryStartGame(() => {
                setActiveMehen({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'aseb') {
            tryStartGame(() => {
                setActiveAseb({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'archery') {
            tryStartGame(() => {
                setActiveArchery({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'jousting') {
            tryStartGame(() => {
                setActiveJousting({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'chess') {
            tryStartGame(() => {
                setActiveChess({ opponent, tavern, settlement, betAmount: bet, mode: 'blitz' });
            }, bet);
        } else if (actType === 'toy_soldiers') {
            tryStartGame(() => {
                setActiveToySoldiers({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'army_battle') {
            tryStartGame(() => {
                setActiveArmyBattle({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'toy_checkers') {
            tryStartGame(() => {
                setActiveToyCheckers({ opponent, tavern, settlement, betAmount: bet, boardSize: 8, gameType: 'toy_checkers' });
            }, bet);
        } else if (actType === 'toy_checkers_10x10') {
            tryStartGame(() => {
                setActiveToyCheckers({ opponent, tavern, settlement, betAmount: bet, boardSize: 10, gameType: 'toy_checkers_10x10' });
            }, bet);
        } else if (actType === 'toy_checkers_12x12') {
            tryStartGame(() => {
                setActiveToyCheckers({ opponent, tavern, settlement, betAmount: bet, boardSize: 12, gameType: 'toy_checkers_12x12' });
            }, bet);
        } else if (actType === 'toy_checkers_classic') {
            tryStartGame(() => {
                setActiveToyCheckers({ opponent, tavern, settlement, betAmount: bet, boardSize: 8, gameType: 'toy_checkers_classic', movementMode: 'checkers_classic' });
            }, bet);
        } else if (actType === 'toy_pawns') {
            tryStartGame(() => {
                setActiveToyPawns({ opponent, tavern, settlement, betAmount: bet, boardSize: 8, gameType: 'toy_pawns' });
            }, bet);
        } else if (actType === 'toy_pawns_10x10') {
            tryStartGame(() => {
                setActiveToyPawns({ opponent, tavern, settlement, betAmount: bet, boardSize: 10, gameType: 'toy_pawns_10x10' });
            }, bet);
        } else if (actType === 'toy_pawns_12x12') {
            tryStartGame(() => {
                setActiveToyPawns({ opponent, tavern, settlement, betAmount: bet, boardSize: 12, gameType: 'toy_pawns_12x12' });
            }, bet);
        } else if (actType === 'wizard_battle') {
            tryStartGame(() => {
                setActiveWizardBattle({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'wizard_tournament') {
            tryStartGame(() => {
                setActiveWizardTournament({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'magic_pawns') {
            tryStartGame(() => {
                setActiveMagicPawns({ opponent, tavern, settlement, betAmount: bet, boardSize: 8, gameType: 'magic_pawns' });
            }, bet);
        } else if (actType === 'magic_pawns_10x10') {
            tryStartGame(() => {
                setActiveMagicPawns({ opponent, tavern, settlement, betAmount: bet, boardSize: 10, gameType: 'magic_pawns_10x10' });
            }, bet);
        } else if (actType === 'magic_pawns_12x12') {
            tryStartGame(() => {
                setActiveMagicPawns({ opponent, tavern, settlement, betAmount: bet, boardSize: 12, gameType: 'magic_pawns_12x12' });
            }, bet);
        } else if (actType === 'fist_fight') {
            tryStartGame(() => {
                setActiveBrawl({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else if (actType === 'fantasy_adventure') {
            tryStartGame(() => {
                setActiveFantasyAdventure({ opponent, tavern, settlement, betAmount: bet });
            }, bet);
        } else {
            handleStartDuel(opponent, tavern, settlement, bet);
        }
    }, [duelResult, currentDuel, handleStartDuel, tryStartGame]);

    const handleGenericGameVictory = useCallback((
        opponent: OpponentData,
        tavern: TavernData,
        settlement: SettlementData,
        activityType: TavernActivityType,
        betAmount: number = 0,
        customProgress?: WorldProgress
    ) => {
        const fullClassicDeck = createDeck('classic');
        const templateCard = fullClassicDeck[Math.floor(Math.random() * fullClassicDeck.length)];
        const randomCard = {
            ...templateCard,
            id: Math.floor(Date.now() + Math.random() * 1000000)
        };
        const cardsGained = [randomCard];

        const baseProg = customProgress || worldProgress;
        const outcome = recordVictory(baseProg, opponent, tavern, activityType);
        const currentRpgCards = outcome.updatedProgress.playerRpgCards || [];
        const updatedProgress = {
            ...outcome.updatedProgress,
            playerGold: outcome.updatedProgress.playerGold + betAmount,
            playerRpgCards: [...currentRpgCards, ...cardsGained]
        };
        setWorldProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        triggerQuestEvent({
            type: 'duel_won',
            opponentId: opponent.id,
            opponentName: opponent.name
        });
        triggerQuestEvent({
            type: 'minigame_won',
            activityType
        });
        setDuelResult({
            isVictory: true,
            opponent,
            tavern,
            settlement,
            activityType,
            betAmount,
            isTavernNowConquered: outcome.isTavernNowConquered,
            unlockedNextName: outcome.unlockedNextName,
            xpEarned: outcome.xpEarned,
            didLevelUp: outcome.didLevelUp,
            newLevel: outcome.newLevel,
            pointsGained: outcome.pointsGained,
            winsAgainstOpponent: outcome.winsAgainstOpponent,
            becameNpc: outcome.becameNpc,
            cardsGained
        });
    }, [worldProgress]);

    const handleGenericGameDefeat = useCallback((
        opponent: OpponentData,
        tavern: TavernData,
        settlement: SettlementData,
        activityType: TavernActivityType,
        betAmount: number = 0,
        customProgress?: WorldProgress
    ) => {
        const baseProg = customProgress || worldProgress;
        const outcome = recordLoss(baseProg, activityType);
        const updatedProgress = {
            ...outcome.updatedProgress,
            playerGold: Math.max(0, outcome.updatedProgress.playerGold - betAmount)
        };
        setWorldProgress(updatedProgress);
        saveWorldProgress(updatedProgress);
        setDuelResult({
            isVictory: false,
            opponent,
            tavern,
            settlement,
            activityType,
            betAmount,
            xpEarned: outcome.xpEarned,
            didLevelUp: outcome.didLevelUp,
            newLevel: outcome.newLevel,
            pointsGained: outcome.pointsGained
        });
    }, [worldProgress]);

    const handleReturnToTavern = useCallback(() => {
        const tavern = duelResult?.tavern || currentDuel?.tavern;
        const settlement = duelResult?.settlement || currentDuel?.settlement;
        setDuelResult(null);
        setCurrentDuel(null);
        setActiveView('world');
        if (settlement) setActiveSettlement(settlement);
        if (tavern) setActiveTavern(tavern);
    }, [currentDuel, duelResult]);

    const handleReturnToMap = useCallback(() => {
        if (lastEncounteredGambler && activeGamblerTarget) {
            const updatedGambler: WanderingGambler = {
                ...lastEncounteredGambler,
                opponent: activeGamblerTarget.type === 'leader'
                    ? { ...lastEncounteredGambler.opponent, isDefeated: true }
                    : lastEncounteredGambler.opponent,
                allies: lastEncounteredGambler.allies.map((ally, idx) =>
                    activeGamblerTarget.type === 'ally' && activeGamblerTarget.index === idx
                        ? { ...ally, isDefeated: true }
                        : ally
                )
            };

            const isLeaderDefeated = updatedGambler.opponent.isDefeated;
            const areAllAlliesDefeated = updatedGambler.allies.every(a => a.isDefeated);
            const isEntireGamblerDefeated = isLeaderDefeated && areAllAlliesDefeated;

            if (isEntireGamblerDefeated) {
                // Find nearest settlement
                const gx = updatedGambler.x;
                const gy = updatedGambler.y;
                let nearest = WORLD_SETTLEMENTS[0];
                let minDistance = Infinity;
                for (const s of WORLD_SETTLEMENTS) {
                    const d = Math.hypot(s.x - gx, s.y - gy);
                    if (d < minDistance) {
                        minDistance = d;
                        nearest = s;
                    }
                }

                if (nearest.taverns && nearest.taverns.length > 0) {
                    const tavern = ensureTavernOpponents(nearest.taverns[0]);
                    if (!tavern.champions) tavern.champions = [];
                    tavern.champions.push(updatedGambler.opponent);
                    for (const ally of updatedGambler.allies) {
                        tavern.champions.push(ally.opponent);
                    }
                }

                setWanderingGamblers(prev => prev.filter(g => g.id !== updatedGambler.id));
                setLastEncounteredGambler(null);
                setActiveGamblerTarget(null);
            } else {
                setWanderingGamblers(prev => prev.map(g => g.id === updatedGambler.id ? updatedGambler : g));
                setActiveWanderingGambler(updatedGambler);
                setLastEncounteredGambler(updatedGambler);
                setActiveGamblerTarget(null);
            }
        }

        setDuelResult(null);
        setCurrentDuel(null);
        setActiveTavern(null);
        setActiveSettlement(null);
        setActiveView('world');
    }, [lastEncounteredGambler, activeGamblerTarget]);

    // Handle Monster Encounters
    const handleHospitalTransport = useCallback(() => {
        const px = worldProgress.playerPosition.x;
        const py = worldProgress.playerPosition.y;
        
        let nearest = WORLD_SETTLEMENTS[0];
        let minDistance = Infinity;
        for (const s of WORLD_SETTLEMENTS) {
            const d = Math.hypot(s.x - px, s.y - py);
            if (d < minDistance) {
                minDistance = d;
                nearest = s;
            }
        }
        
        setWorldProgress(prev => {
            const updated = {
                ...prev,
                playerPosition: {
                    x: nearest.x,
                    y: nearest.y,
                    targetX: nearest.x,
                    targetY: nearest.y,
                    isMoving: false
                }
            };
            return updated;
        });

        // Close all active modals
        setActiveBrawl(null);
        setActiveFencing(null);
        setLastEncounteredSquad(null);
        setDuelResult(null);
        setCurrentDuel(null);
        setActiveView('world');
        
        alert(`Після жорстокої поразки, поранений герой з останніх сил дістався до найближчого поселення: ${nearest.name}, щоб знайти лікарню.`);
    }, [worldProgress.playerPosition]);

    // Monster Squad Encounter Resolution Hook (Cards)
    useEffect(() => {
        if (!duelResult || !lastEncounteredSquad) return;
        
        if (duelResult.isVictory) {
            setWanderingSquads(prev => respawnDefeatedSquad(prev, lastEncounteredSquad.id));
            setLastEncounteredSquad(null);
        } else if (!duelResult.isVictory) {
            handleHospitalTransport();
        }
    }, [duelResult, lastEncounteredSquad, handleHospitalTransport]);

    const handleMonsterCardDuel = useCallback((squad: MonsterSquad, betAmount: number, preemptiveDamage: number = 0) => {
        setLastEncounteredSquad(squad);
        setActiveMonsterEncounter(null);

        const baseOpponent: OpponentData = squad.leader.opponent;
        const monsterOpponent: OpponentData = preemptiveDamage > 0 ? {
            ...baseOpponent,
            hp: Math.max(10, baseOpponent.hp - preemptiveDamage),
            baseHp: Math.max(10, baseOpponent.baseHp - preemptiveDamage)
        } : baseOpponent;

        const wildernessTavern: TavernData = {
            id: `enc-tavern-${squad.id}`,
            name: `Битва: ${squad.name}`,
            sign: squad.avatar,
            description: `Зіткнення з ворожим загоном просто неба!`,
            keeperName: squad.leader.name,
            atmosphere: 'Навколо кружляє вітер пустки, вороги оточують вашого героя.',
            contenders: [monsterOpponent],
            champions: [],
            brawlers: [monsterOpponent],
            brawlChampions: []
        };

        const wildernessSettlement: SettlementData = {
            id: `enc-settle-${squad.id}`,
            name: `Дикі Землі (${squad.name})`,
            type: 'ruins',
            region: 'Дикі Землі',
            x: squad.x,
            y: squad.y,
            description: `Місце зіткнення з монстрами під проводом ${squad.leader.name}`,
            taverns: [wildernessTavern]
        };

        handleStartDuel(monsterOpponent, wildernessTavern, wildernessSettlement, betAmount);
    }, [handleStartDuel]);

    const handleMonsterBrawl = useCallback((squad: MonsterSquad, preemptiveDamage: number = 0) => {
        setLastEncounteredSquad(squad);
        setActiveMonsterEncounter(null);

        const baseOpponent: OpponentData = squad.leader.opponent;
        const monsterOpponent: OpponentData = preemptiveDamage > 0 ? {
            ...baseOpponent,
            hp: Math.max(10, baseOpponent.hp - preemptiveDamage),
            baseHp: Math.max(10, baseOpponent.baseHp - preemptiveDamage)
        } : baseOpponent;

        const wildernessTavern: TavernData = {
            id: `brawl-tavern-${squad.id}`,
            name: `Сутичка: ${squad.name}`,
            sign: squad.avatar,
            description: `Кулачний бій на смерть з ватажком монстрів`,
            keeperName: squad.leader.name,
            atmosphere: 'Сутичка на смерть серед диких хащів.',
            contenders: [monsterOpponent],
            champions: [],
            brawlers: [monsterOpponent],
            brawlChampions: []
        };

        const wildernessSettlement: SettlementData = {
            id: `brawl-settle-${squad.id}`,
            name: `Дикі Землі`,
            type: 'ruins',
            region: 'Дикі Землі',
            x: squad.x,
            y: squad.y,
            description: `Сутичка з ватажком монстрів`,
            taverns: [wildernessTavern]
        };

        setActiveBrawl({
            opponent: monsterOpponent,
            tavern: wildernessTavern,
            settlement: wildernessSettlement,
            betAmount: 0
        });
    }, []);

    const handleStartMonsterCombat = useCallback((squad: MonsterSquad, targetType: 'leader' | 'ally' = 'leader', allyIndex?: number, preemptiveDamage: number = 0) => {
        setLastEncounteredSquad(squad);
        setActiveMonsterEncounter(null);
        setActiveGoldBoxCombat({
            squad,
            preemptiveDamage
        });
    }, []);

    const handleFleeFromMonster = useCallback((squad: MonsterSquad) => {
        setActiveMonsterEncounter(null);
        // Push squad further away and set to patrolling
        setWanderingSquads(prev => prev.map(s => {
            if (s.id === squad.id) {
                return {
                    ...s,
                    state: 'patrolling',
                    x: Math.max(5, Math.min(95, s.x + (Math.random() > 0.5 ? 8 : -8))),
                    y: Math.max(5, Math.min(95, s.y + (Math.random() > 0.5 ? 8 : -8)))
                };
            }
            return s;
        }));
    }, []);

    const handleStartGamblerGame = useCallback((gambler: WanderingGambler, betAmount: number, targetType: 'leader' | 'ally' = 'leader', allyIndex?: number) => {
        setActiveWanderingGambler(null);
        setLastEncounteredGambler(gambler);
        setActiveGamblerTarget({ type: targetType, index: allyIndex });

        const targetOpponent = targetType === 'leader' ? gambler.opponent : gambler.allies[allyIndex!].opponent;

        const wildernessTavern: TavernData = {
            id: `gambler-tavern-${gambler.id}`,
            name: `Табір майстра: ${targetOpponent.name}`,
            sign: targetOpponent.avatar,
            description: `Придорожній табір супротивника ${targetOpponent.name}.`,
            keeperName: targetOpponent.name,
            atmosphere: `Тріпоче багаття, на розстеленому плащі розкладено інвентар гри «${gambler.gameName}».`,
            contenders: [targetOpponent],
            champions: [targetOpponent],
            brawlers: [targetOpponent],
            brawlChampions: [targetOpponent],
            classicDurakContenders: [targetOpponent],
            classicDurakChampions: [targetOpponent],
            extendedDurakContenders: [targetOpponent],
            extendedDurakChampions: [targetOpponent],
            dicePokerContenders: [targetOpponent],
            dicePokerChampions: [targetOpponent],
            tavernDiceContenders: [targetOpponent],
            tavernDiceChampions: [targetOpponent],
            checkersContenders: [targetOpponent],
            checkersChampions: [targetOpponent],
            senetContenders: [targetOpponent],
            senetChampions: [targetOpponent],
            urContenders: [targetOpponent],
            urChampions: [targetOpponent],
            mehenContenders: [targetOpponent],
            mehenChampions: [targetOpponent],
            asebContenders: [targetOpponent],
            asebChampions: [targetOpponent]
        };

        const wildernessSettlement: SettlementData = {
            id: `gambler-settle-${gambler.id}`,
            name: `Тракт мандрівників`,
            type: 'village',
            region: 'Тракти Елдрії',
            x: gambler.x,
            y: gambler.y,
            description: `Зустріч з мандрівним майстром на дорозі`,
            taverns: [wildernessTavern]
        };

        tryStartGame(() => {
            switch (gambler.gameType) {
                case 'classic_durak_36':
                    setActiveClassicDurak({
                        mode: '36',
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'classic_durak_52':
                    setActiveClassicDurak({
                        mode: '52',
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'rpg_cards':
                    handleStartDuel(gambler.opponent, wildernessTavern, wildernessSettlement, betAmount);
                    break;
                case 'french_tarot':
                    setActiveFrenchTarot({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'blackjack':
                    setActiveBlackjack({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'blackjack_dice':
                    setActiveBlackjackDice({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'steeplechase':
                    setActiveHorseRace({
                        raceType: 'steeplechase',
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'dice_poker':
                    setActiveDicePoker({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'tavern_dice':
                    setActiveTavernDice({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'checkers':
                    setActiveCheckers({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'senet':
                    setActiveSenet({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'ur':
                    setActiveUr({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'mehen':
                    setActiveMehen({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'aseb':
                    setActiveAseb({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'archery':
                    setActiveArchery({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'jousting':
                    setActiveJousting({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'chess_standard':
                    setActiveChess({
                        variant: 'standard',
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'shatranj':
                    setActiveChess({
                        variant: 'shatranj',
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'brawl':
                    setActiveBrawl({
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                case 'fencing':
                    setActiveFencing({
                        mode: 'sword_shield',
                        opponent: gambler.opponent,
                        tavern: wildernessTavern,
                        settlement: wildernessSettlement,
                        betAmount
                    });
                    break;
                default:
                    handleStartDuel(gambler.opponent, wildernessTavern, wildernessSettlement, betAmount);
            }
        }, betAmount);
    }, [handleStartDuel, tryStartGame]);

    // Local Bot Loop (only when in solo mode and viewing the arena)
    useEffect(() => {
        if (activeView !== 'arena') return;
        if (isMultiplayerActive) return;
        if (localGameState.gameOver) return;

        const currentTurnPlayer = localGameState.players.find(p => p.id === localGameState.turnPlayerId);
        if (!currentTurnPlayer || currentTurnPlayer.isHuman) return;

        const botTimer = setTimeout(() => {
            setLocalGameState(prevState => runBotTurn(prevState));
        }, 900);

        return () => clearTimeout(botTimer);
    }, [localGameState, isMultiplayerActive, activeView]);

    // Local Human Auto-Skip / Take when impossible to move (only in arena)
    useEffect(() => {
        if (activeView !== 'arena') return;
        if (isMultiplayerActive) return;
        if (localGameState.gameOver || localGameState.turnPlayerId !== 0) return;

        const human = localGameState.players.find(p => p.id === 0);
        if (!human || human.outRank || human.isEliminated) return;

        const canMove = canPlayerMakeMove(
            human,
            localGameState.table,
            localGameState.defenderId,
            localGameState.actualTrumpSuits,
            localGameState.isLockedByGrandmaster,
            SENIOR_SUIT,
            localGameState.isPaladinDefenseLocked
        );

        if (!canMove) {
            const timer = setTimeout(() => {
                setLocalGameState(prevState => {
                    if (prevState.gameOver || prevState.turnPlayerId !== 0) return prevState;
                    const curHuman = prevState.players.find(p => p.id === 0);
                    if (!curHuman || curHuman.outRank || curHuman.isEliminated) return prevState;

                    if (prevState.defenderId === 0) {
                        if (prevState.table.some(p => !p.defense)) {
                            return takeCardsState(prevState);
                        } else {
                            const attackers = prevState.players.filter(p => p.id !== 0 && !p.outRank && !p.isEliminated && p.hand.length > 0);
                            if (attackers.length === 0) {
                                return finishBoutState(prevState, 'pass');
                            }
                            const primaryAttacker = attackers.find(p => p.id === prevState.attackerId);
                            return {
                                ...prevState,
                                turnPlayerId: primaryAttacker ? primaryAttacker.id : attackers[0].id
                            };
                        }
                    } else {
                        return passTurnState(prevState, 0);
                    }
                });
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [localGameState, isMultiplayerActive, activeView]);

    // Validation check for player's cards
    const checkValidPlay = useCallback((card: Card) => {
        if (localGameState.gameOver || localGameState.turnPlayerId !== activePlayerId) return false;

        const player = localGameState.players.find(p => p.id === activePlayerId);
        if (!player) return false;

        const requiredEternal = getRequiredEternalDiscardCount(card);
        const eternalCount = localGameState.eternalDiscardPile?.length || 0;
        if (requiredEternal > 0 && eternalCount < requiredEternal) {
            return false;
        }

        if (isInstantSpellCard(card)) return true;

        if (localGameState.turnPlayerId === localGameState.defenderId) {
            const undefPair = localGameState.table.find(p => !p.defense);
            if (undefPair) {
                const effectiveCard = player.strengthBoost
                    ? { ...card, strengthBonus: (card.strengthBonus || 0) + player.strengthBoost }
                    : card;
                return canBeat(undefPair.attack, effectiveCard, localGameState.actualTrumpSuits, SENIOR_SUIT);
            }
            return false;
        } else {
            const defender = localGameState.players.find(p => p.id === localGameState.defenderId);
            const initialDefenderHand = defender ? defender.hand.length + localGameState.table.filter(p => p.defense).length : 6;
            const maxAttacks = Math.min(6, initialDefenderHand);

            if (localGameState.table.length >= maxAttacks) return false;

            return canAttackWithCard(
                card, 
                localGameState.table, 
                localGameState.isLockedByGrandmaster, 
                localGameState.isPaladinDefenseLocked, 
                localGameState.actualTrumpSuits, 
                SENIOR_SUIT,
                localGameState.eternalDiscardPile?.length || 0
            );
        }
    }, [localGameState, activePlayerId]);

    // Playing a card
    const handleCardClick = (card: Card) => {
        // If we are in Vampire spell mode, click actions inside hand are ignored
        if (vampireSpellCaster) return;

        // Check validation
        const isValidPlay = checkValidPlay(card);
        if (!isValidPlay) return;

        // If it is a Vampire Spell card, open the discard selection modal directly!
        if (card.isVampireSpell) {
            setVampireSpellCaster(card);
            return;
        }

        if (isMultiplayerActive) {
            sendNetworkAction('GAME_ACTION', { subAction: 'PLAY_CARD', card });
        } else {
            setLocalGameState(prevState => playCardAndLog(prevState, card, 0));
        }
    };

    // Handle selecting a card from discard pile for Vampire Spell conversion
    const handleVampireDiscardSelect = (targetCard: Card) => {
        if (!vampireSpellCaster) return;

        if (isMultiplayerActive) {
            sendNetworkAction('GAME_ACTION', { subAction: 'PLAY_CARD', card: vampireSpellCaster, targetCardId: targetCard.id });
        } else {
            setLocalGameState(prevState => playCardAndLog(prevState, vampireSpellCaster, 0, targetCard.id));
        }
        setVampireSpellCaster(null);
    };

    // Passing turn / Bito
    const handlePass = () => {
        if (isMultiplayerActive) {
            sendNetworkAction('GAME_ACTION', { subAction: 'PASS_TURN' });
        } else {
            setLocalGameState(prevState => passTurnState(prevState, 0));
        }
    };

    // Taking cards
    const handleTake = () => {
        if (isMultiplayerActive) {
            sendNetworkAction('GAME_ACTION', { subAction: 'TAKE_CARDS' });
        } else {
            setLocalGameState(prevState => takeCardsState(prevState));
        }
    };

    // Empowering a card
    const handleEmpowerCard = (cardId: number, e?: MouseEvent) => {
        if (e) e.stopPropagation();
        
        if (isMultiplayerActive) {
            sendNetworkAction('GAME_ACTION', { subAction: 'EMPOWER_CARD', cardId });
        } else {
            setLocalGameState(prevState => {
                const human = prevState.players.find(p => p.id === 0);
                if (!human || human.powerPoints <= 0) return prevState;

                const cardToEmpower = human.hand.find(c => c.id === cardId);
                if (!cardToEmpower || cardToEmpower.isEmpowered) return prevState;

                const updatedPlayers = prevState.players.map(p => {
                    if (p.id === 0) {
                        return {
                            ...p,
                            powerPoints: p.powerPoints - 1,
                            hand: p.hand.map(c => c.id === cardId ? { ...c, isEmpowered: true } : c)
                        };
                    }
                    return p;
                });

                const resState = {
                    ...prevState,
                    players: updatedPlayers,
                    statusBanner: `⚡ Ви використали 1 очко сили та надали карті силу козиря! (Залишилось очок: ${human.powerPoints - 1})`
                };
                return addLog(resState, `⚡ ${human.name} посилив карту [${cardToEmpower.rank}${cardToEmpower.suit}] до козиря!`, 'spell');
            });
        }
    };

    // Buying shop items
    const handleBuyShopItem = (itemKey: keyof ShopStock) => {
        if (isMultiplayerActive) {
            sendNetworkAction('GAME_ACTION', { subAction: 'BUY_SHOP_ITEM', itemKey });
        } else {
            setLocalGameState(prevState => {
                const nextState = buyShopItemState(prevState, 0, itemKey);
                // Also update persistent opponent shop stock if in duel
                if (currentDuel?.opponent?.id && nextState.shopStock) {
                    const oppId = currentDuel.opponent.id;
                    const updatedShops = {
                        ...(worldProgress.opponentSpellShops || {}),
                        [oppId]: nextState.shopStock
                    };
                    const updatedProg: WorldProgress = {
                        ...worldProgress,
                        opponentSpellShops: updatedShops
                    };
                    setWorldProgress(updatedProg);
                    saveWorldProgress(updatedProg);
                }
                return nextState;
            });
        }
    };

    // Refreshing current opponent's spell shop with 1 token
    const handleRefreshSpellShop = () => {
        const oppId = currentDuel?.opponent?.id;
        const currentTokens = worldProgress.shopRefreshTokens || 0;
        if (currentTokens <= 0) return;

        const freshStock = { ...INITIAL_SHOP_STOCK };
        const updatedShops = {
            ...(worldProgress.opponentSpellShops || {}),
            ...(oppId ? { [oppId]: freshStock } : {})
        };
        const updatedProgress: WorldProgress = {
            ...worldProgress,
            shopRefreshTokens: currentTokens - 1,
            opponentSpellShops: updatedShops
        };
        setWorldProgress(updatedProgress);
        saveWorldProgress(updatedProgress);

        setLocalGameState(prev => ({
            ...prev,
            shopStock: freshStock,
            combatLog: [
                ...(prev.combatLog || []),
                {
                    id: `refresh-${Date.now()}`,
                    text: `🎟️ Ви використали 1 токен оновлення! Магазин заклять ${currentDuel?.opponent?.name || 'супротивника'} повністю відновлено!`,
                    type: 'system',
                    timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }
            ]
        }));
        playSparkleSound();
    };

    const handleSelectSmeltingCard = (cardKey: string) => {
        if (!localGameState.activeSmeltingPicker) return;
        setLocalGameState(prevState => pickSmeltingCardState(prevState, prevState.activeSmeltingPicker!.playerId, cardKey));
    };

    // Hand re-ordering
    const handleMoveCardLeft = (index: number) => {
        if (index <= 0) return;
        if (!isMultiplayerActive) {
            setLocalGameState(prevState => {
                const players = prevState.players.map(p => {
                    if (p.id === 0) {
                        const hand = [...p.hand];
                        const temp = hand[index];
                        hand[index] = hand[index - 1];
                        hand[index - 1] = temp;
                        return { ...p, hand };
                    }
                    return p;
                });
                return { ...prevState, players };
            });
        }
    };

    const handleMoveCardRight = (index: number) => {
        if (!isMultiplayerActive) {
            setLocalGameState(prevState => {
                const human = prevState.players.find(p => p.id === 0);
                if (!human || index >= human.hand.length - 1) return prevState;
                const players = prevState.players.map(p => {
                    if (p.id === 0) {
                        const hand = [...p.hand];
                        const temp = hand[index];
                        hand[index] = hand[index + 1];
                        hand[index + 1] = temp;
                        return { ...p, hand };
                    }
                    return p;
                });
                return { ...prevState, players };
            });
        }
    };

    const activePlayer = localGameState.players.find(p => p.id === activePlayerId);
    const opponents = localGameState.players.filter(p => p.id !== activePlayerId);
    const isPlayerTurn = localGameState.turnPlayerId === activePlayerId && !localGameState.gameOver;
    const canMoveNow = activePlayer ? canPlayerMakeMove(
        activePlayer,
        localGameState.table,
        localGameState.defenderId,
        localGameState.actualTrumpSuits,
        localGameState.isLockedByGrandmaster,
        SENIOR_SUIT,
        localGameState.isPaladinDefenseLocked,
        localGameState.eternalDiscardPile?.length || 0
    ) : false;

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#141210] to-black text-[#f5ebd7] flex flex-col font-sans select-none overflow-x-hidden">
            {/* Header Toolbar */}
            <header className="flex justify-between items-center p-3 sm:p-4 border-b border-[#b8860b]/30 bg-[#120f0d]/90 backdrop-blur-md z-30 shadow-md">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-black font-['Cinzel'] tracking-wide bg-gradient-to-r from-amber-200 via-[#d4af37] to-amber-500 bg-clip-text text-transparent flex items-center gap-1.5">
                        <span>⚔️</span> Карткова Битва
                    </h1>

                    {/* Mode Navigation (World Map vs Battle Arena) */}
                    <div className="flex items-center bg-[#1d1611] p-1 rounded-full border border-[#b8860b]/40 shadow-inner">
                        <button
                            id="btn-nav-world-map"
                            onClick={() => setActiveView('world')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                activeView === 'world'
                                    ? 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 text-black shadow-md font-black'
                                    : 'text-[#c4b5a0] hover:text-[#f5ebd7]'
                            }`}
                        >
                            <MapIcon className="w-3.5 h-3.5" />
                            <span>Карта Світу</span>
                        </button>

                        <button
                            id="btn-nav-battle-arena"
                            onClick={() => setActiveView('arena')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                activeView === 'arena'
                                    ? 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 text-black shadow-md font-black'
                                    : 'text-[#c4b5a0] hover:text-[#f5ebd7]'
                            }`}
                        >
                            <Swords className="w-3.5 h-3.5" />
                            <span>{currentDuel ? `Бій: ${currentDuel.opponent.name}` : 'Арена Бою'}</span>
                        </button>
                    </div>

                    {/* Multiplayer Status Button */}
                    <button
                        id="btn-open-multiplayer"
                        onClick={() => setIsMultiplayerOpen(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md hover:scale-105 border ${
                            isMultiplayerActive
                                ? 'bg-[#3d2716] border-[#d4af37] text-[#d4af37]'
                                : 'bg-[#241c16] border-[#b8860b]/40 text-[#c4b5a0] hover:text-[#f5ebd7]'
                        }`}
                    >
                        <Radio className={`w-3.5 h-3.5 ${isMultiplayerActive ? 'text-green-400 animate-pulse' : 'text-[#d4af37]'}`} />
                        <span>{isMultiplayerActive ? `Кімната #${currentRoom?.code}` : 'Мережа (Онлайн)'}</span>
                    </button>

                    {!isMultiplayerActive && activeView === 'arena' && (
                        <button 
                            id="btn-player-count-settings"
                            onClick={() => setIsSettingsOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#241c16] hover:bg-[#33271f] border border-[#b8860b]/40 rounded-full text-xs font-semibold text-[#f5ebd7] transition-all hover:scale-105"
                        >
                            <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span>Гравців: {playerCount}</span>
                        </button>
                    )}

                    {localGameState.deckMode === 'classic54' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-full text-[10px] font-bold shadow-sm">
                            🃏 Чистий Дурень (54)
                        </span>
                    )}
                    {localGameState.deckMode === 'classic56' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded-full text-[10px] font-bold shadow-sm">
                            🃏 Розширена (56)
                        </span>
                    )}
                    {localGameState.deckMode === 'minor_tarot' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-full text-[10px] font-bold shadow-sm">
                            🪄 Молодші Аркани Таро
                        </span>
                    )}
                    {localGameState.deckMode === 'classic' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-full text-[10px] font-bold shadow-sm">
                            🏰 RPG Класика
                        </span>
                    )}
                    {localGameState.deckMode === 'extended' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-full text-[10px] font-bold shadow-sm">
                            ✨ RPG Мега
                        </span>
                    )}
                    {localGameState.deckMode === 'tarot' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 text-purple-300 rounded-full text-[10px] font-bold shadow-sm">
                            🔮 Таро
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button 
                        id="btn-open-tutorial"
                        onClick={() => setIsTutorialOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a221b] hover:bg-[#3d2f24] border border-[#b8860b]/40 rounded-full text-xs font-bold text-[#d4af37] transition-all hover:scale-105 shadow-sm"
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Правила</span>
                    </button>

                    <button 
                        id="btn-toggle-combat-log"
                        onClick={() => setIsLogOpen(prev => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 shadow-sm border ${
                            isLogOpen 
                                ? 'bg-[#3b2d1d] border-[#d4af37] text-[#d4af37]' 
                                : 'bg-[#241c16] border-[#b8860b]/30 text-[#c4b5a0]'
                        }`}
                    >
                        <Scroll className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span className="hidden sm:inline">Лог</span>
                    </button>

                    <button 
                        id="btn-open-shop"
                        onClick={() => setIsShopOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#b8860b]/30 to-[#d4af37]/30 hover:from-[#b8860b]/50 hover:to-[#d4af37]/50 border border-[#d4af37] rounded-full text-xs font-bold text-[#d4af37] transition-all hover:scale-105 shadow-md"
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Магазин</span>
                        {activePlayer && (
                            <span className="px-1.5 py-0.5 bg-[#d4af37] text-[#120f0d] rounded-full text-[10px] font-black ml-0.5">
                                {activePlayer.powerPoints} ⚡
                            </span>
                        )}
                    </button>

                    {activeView === 'world' && (
                        <>
                            <button
                                id="btn-open-deck-builder"
                                onClick={() => setIsDeckBuilderOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#241c16] hover:bg-[#382b20] border border-[#b8860b]/40 rounded-full text-xs font-bold text-amber-300 transition-all hover:scale-105 shadow-md cursor-pointer"
                                title="Дек-білдер: Налаштувати свою активну колоду для дуелей"
                            >
                                <Layers className="w-3.5 h-3.5 text-amber-400" />
                                <span>Моя Колода</span>
                                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-black">
                                    {worldProgress.playerRpgDeck?.length ?? 0}
                                </span>
                            </button>

                            <button
                                id="btn-open-card-master"
                                onClick={() => setIsCardMasterOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#241c16] hover:bg-[#382b20] border border-[#b8860b]/40 rounded-full text-xs font-bold text-amber-300 transition-all hover:scale-105 shadow-md cursor-pointer"
                                title="Майстер Карт: Переплавка відбою у Пусті Карти та створення Геройських Карт"
                            >
                                <span>🧙‍♂️</span>
                                <span>Майстер Карт</span>
                                {Boolean(worldProgress.blankCardsCount) && (
                                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-black">
                                        📄 {worldProgress.blankCardsCount}
                                    </span>
                                )}
                            </button>
                        </>
                    )}

                    <button
                        id="btn-open-quest-journal"
                        onClick={() => setIsQuestModalOpen(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 shadow-md border cursor-pointer ${
                            (worldProgress.activeQuests || []).some(q => q.status === 'completed')
                                ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-stone-950 font-black border-yellow-300 animate-pulse'
                                : 'bg-[#241c16] hover:bg-[#382b20] border-amber-500/50 text-amber-200'
                        }`}
                        title="Журнал завдань та дошка оголошень від НПЦ"
                    >
                        <span>📜</span>
                        <span>Квести</span>
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-black font-mono">
                            {worldProgress.activeQuests?.length || 0}
                        </span>
                        {(worldProgress.activeQuests || []).some(q => q.status === 'completed') && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        )}
                    </button>

                    <button
                        id="btn-open-squad-formation"
                        onClick={() => setIsCharacterStatsOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 shadow-md border cursor-pointer bg-[#241c16] hover:bg-[#382b20] border-amber-600/50 text-amber-200"
                        title="Лицарський загін та бойовий стрій"
                    >
                        <span>🛡️</span>
                        <span className="hidden sm:inline">Загін</span>
                        <span className="px-1.5 py-0.2 bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-black">
                            {(worldProgress.hiredNpcs?.length || 0) + 1}
                        </span>
                    </button>

                    <button
                        id="btn-open-toy-collection"
                        onClick={() => setIsToyCollectionOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 shadow-md border cursor-pointer bg-[#241c16] hover:bg-[#382b20] border-amber-500/50 text-amber-200"
                        title="Переглянути колекцію ваших іграшкових фігурок"
                    >
                        <span>🎎</span>
                        <span>Фігурки</span>
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-black font-mono">
                            {worldProgress.toySoldiers?.length || 0}
                        </span>
                    </button>

                    <button
                        id="btn-open-character-stats"
                        onClick={() => setIsCharacterStatsOpen(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 shadow-md border cursor-pointer ${
                            (worldProgress.playerStats?.statPoints || 0) > 0
                                ? 'bg-yellow-500 text-black border-yellow-300 font-black animate-pulse'
                                : 'bg-[#241c16] hover:bg-[#382b20] border-[#b8860b]/40 text-amber-300'
                        }`}
                        title="Характеристики та прокачка персонажа"
                    >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Рівень {worldProgress.playerStats?.level ?? 0}</span>
                        {(worldProgress.playerStats?.statPoints || 0) > 0 && (
                            <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px] font-black">
                                +{worldProgress.playerStats?.statPoints}
                            </span>
                        )}
                    </button>

                    <button 
                        id="btn-reset-campaign-progress"
                        onClick={() => setIsResetConfirmOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/45 hover:bg-rose-900 border border-rose-700/50 rounded-full text-xs font-bold text-rose-300 transition-all hover:scale-105 shadow-sm"
                        title="Скинути прогрес і почати гру заново"
                    >
                        <RefreshCw className="w-3 h-3 text-rose-400" />
                        <span className="hidden sm:inline">Скинути прогрес</span>
                    </button>

                    {activeView === 'arena' && (
                        <div className="flex items-center gap-2">
                            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#1e1712] border border-[#b8860b]/40 flex items-center gap-1.5 text-[#f5ebd7]">
                                {isPlayerTurn ? (
                                    <><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ваш хід</>
                                ) : (
                                    <><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Хід: {localGameState.players.find(p => p.id === localGameState.turnPlayerId)?.name}</>
                                )}
                            </div>
                            <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300">
                                ⏳ Хід: {localGameState.turnNumber || 1} / 140
                            </div>
                        </div>
                    )}

                    {!isMultiplayerActive && activeView === 'arena' && (
                        <button 
                            id="btn-restart-game"
                            onClick={() => startNewGame()} 
                            title="Нова гра"
                            className="p-2 bg-[#241c16] hover:bg-[#3d2f24] border border-[#b8860b]/40 rounded-full transition-colors text-[#d4af37]"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </header>

            {/* View Switcher: World Map vs Main Game Arena */}
            {activeView === 'world' ? (
                <WorldMapView
                    progress={worldProgress}
                    onUpdateProgress={setWorldProgress}
                    onEnterSettlement={(settlement) => {
                        setActiveSettlement(settlement);
                        triggerQuestEvent({
                            type: 'settlement_visited',
                            settlementId: settlement.id,
                            settlementName: settlement.name
                        });
                    }}
                    onStartQuickPlay={() => setActiveView('arena')}
                    onOpenCharacterModal={() => setIsCharacterStatsOpen(true)}
                    onOpenQuestModal={() => setIsQuestModalOpen(true)}
                    wanderingSquads={wanderingSquads}
                    onUpdateSquads={setWanderingSquads}
                    onMonsterEncounter={(squad) => setActiveMonsterEncounter(squad)}
                    wanderingGamblers={wanderingGamblers}
                    onUpdateGamblers={setWanderingGamblers}
                    onGamblerEncounter={(gambler) => setActiveWanderingGambler(gambler)}
                    isEncounterActive={Boolean(
                        activeMonsterEncounter || 
                        activeWanderingGambler || 
                        activeSettlement || 
                        activeTavern ||
                        activeClassicDurak ||
                        activeFrenchTarot ||
                        activeBlackjack ||
                        activeBlackjackDice ||
                        activeHorseRace ||
                        activeDicePoker ||
                        activeTavernDice ||
                        activeCheckers ||
                        activeSenet ||
                        activeUr ||
                        activeMehen ||
                        activeAseb ||
                        activeArchery ||
                        activeJousting ||
                        activeChess ||
                        activeBrawl ||
                        activeFencing ||
                        activePotionRoulette ||
                        activeLabyrinth ||
                        activeTreasureHunter ||
                        activeDiceDuel ||
                        activeDiceDuelTournament ||
                        activeD20Dice ||
                        activeCoinFlip ||
                        activeToySoldiers ||
                        activeArmyBattle ||
                        activeToyCheckers ||
                        activeToyPawns ||
                        activeWizardBattle ||
                        activeWizardTournament ||
                        activeMagicPawns ||
                        activeGoldBoxCombat ||
                        isToyShopOpen ||
                        isDecompressionMasterOpen ||
                        isToyCollectionOpen ||
                        isDeckBuilderOpen ||
                        isCharacterStatsOpen ||
                        isShopOpen ||
                        isSettingsOpen ||
                        isTutorialOpen ||
                        isResetConfirmOpen ||
                        pendingBetAction ||
                        currentDuel
                    )}
                />
            ) : (
                /* Main Game Arena */
                <main className="flex-1 flex flex-col justify-between p-2 sm:p-4 relative max-w-7xl mx-auto w-full">
                    {/* Tavern Duel Top Header Banner (when inside a tavern duel) */}
                    {currentDuel && (
                        <div className="mb-2 p-2.5 bg-[#1b150f]/95 border border-[#b8860b]/50 rounded-xl flex items-center justify-between gap-3 text-xs backdrop-blur-sm shadow-lg flex-wrap">
                            <div className="flex items-center gap-2.5">
                                <span className="text-2xl p-1 bg-black/50 rounded-lg border border-[#b8860b]/40">
                                    {currentDuel.opponent.avatar}
                                </span>
                                <div>
                                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                                        <span>⚔️ Поєдинок у таверні «{currentDuel.tavern.name}»</span>
                                        <span className="text-[10px] text-[#a89988] bg-black/40 px-2 py-0.5 rounded-full border border-stone-800">
                                            {currentDuel.settlement.name}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-[#c4b5a0] mt-0.5">
                                        Суперник: <strong className="text-amber-200">{currentDuel.opponent.title} — {currentDuel.opponent.name}</strong> • ❤️ {currentDuel.opponent.hp} HP, 🛡️ {currentDuel.opponent.armor}, ⚡ {currentDuel.opponent.powerPoints}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleReturnToTavern}
                                className="px-3.5 py-1.5 bg-[#2a2017] hover:bg-[#3d2f23] border border-[#b8860b]/50 rounded-full font-bold text-amber-200 text-xs transition flex items-center gap-1.5 shadow-sm"
                            >
                                <Beer className="w-3.5 h-3.5 text-amber-400" />
                                <span>До таверни</span>
                            </button>
                        </div>
                    )}

                    {/* Main Game Board */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                    {/* Opponents Area */}
                    <div className="py-2 px-1 flex justify-center items-center gap-2 sm:gap-4 flex-wrap max-h-[200px] sm:max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#b8860b]/40">
                        {opponents.map(opp => (
                            <OpponentView 
                                key={`opp-player-${opp.id}`}
                                player={opp}
                                isAttacker={opp.id === localGameState.attackerId}
                                isDefender={opp.id === localGameState.defenderId}
                                isTurn={opp.id === localGameState.turnPlayerId}
                                compact={opponents.length > 3}
                                prikupCount={localGameState.prikupDecks?.[opp.id]?.length || 0}
                                turnNumber={localGameState.turnNumber}
                            />
                        ))}
                    </div>

                    {/* Table Center & Deck */}
                    <div className="flex-1 my-4 flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-5xl mx-auto z-10 px-2">
                        {/* Trump Cards & Suits Display (No shared deck) */}
                        <div className="flex flex-col items-center gap-2 shrink-0 bg-[#1f1914]/90 p-3 rounded-2xl border border-[#b8860b]/40 shadow-xl">
                            <div className="text-[11px] font-bold text-[#d4af37] tracking-wider uppercase flex items-center gap-1">
                                <span>⚔️ Козирі дуелі</span>
                            </div>
                            <div className="relative w-24 h-28 flex items-center justify-center my-1">
                                {localGameState.trumpCards[0] && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 shadow-xl">
                                        <CardView card={localGameState.trumpCards[0]} />
                                    </div>
                                )}
                                {localGameState.trumpCards[1] && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 translate-x-4 shadow-xl">
                                        <CardView card={localGameState.trumpCards[1]} />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#241c16] border border-[#b8860b]/40 rounded-full text-xs font-bold text-[#d4af37]">
                                <span>Козирі:</span>
                                {localGameState.actualTrumpSuits.map((s, idx) => (
                                    <span key={`trump-suit-${idx}`} className="text-sm">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Battle Table (Pairs of Attack & Defense) */}
                        <div className="flex-1 flex flex-wrap items-center justify-center gap-3 p-4 min-h-[140px] sm:min-h-[180px] bg-[#1a1410]/80 border-2 border-[#b8860b]/30 rounded-2xl shadow-inner backdrop-blur-sm">
                            {localGameState.table.length === 0 ? (
                                <div className="text-center text-[#8c765a] text-xs sm:text-sm font-['Cinzel'] tracking-wide">
                                    ⚔️ Стіл порожній. Очікування ходу атакуючого...
                                </div>
                            ) : (
                                localGameState.table.map((pair, index) => (
                                    <div key={`table-pair-${index}`} className="relative flex items-center">
                                        <div className="w-16 h-22 sm:w-20 sm:h-28 shadow-lg">
                                            <CardView card={pair.attack} />
                                        </div>
                                        {pair.defense ? (
                                            <div className="absolute top-2 left-3 sm:left-4 w-16 h-22 sm:w-20 sm:h-28 shadow-2xl z-10">
                                                <CardView card={pair.defense} />
                                            </div>
                                        ) : (
                                            <div className="absolute top-2 left-3 sm:left-4 w-16 h-22 sm:w-20 sm:h-28 border-2 border-dashed border-red-500/40 rounded-xl flex items-center justify-center z-10 bg-red-950/20">
                                                <span className="text-[10px] text-red-300 font-bold">Бити</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Discard Piles (Normal & Eternal Discard) */}
                        <div className="flex flex-row sm:flex-col items-center gap-2 shrink-0">
                            <button
                                id="btn-inspect-discard"
                                onClick={() => setInspectPile('discard')}
                                className="relative w-16 h-22 sm:w-20 sm:h-28 bg-[#1f1914] border-2 border-[#b8860b]/50 rounded-xl flex flex-col items-center justify-center shadow-lg hover:border-[#d4af37] transition"
                                title="Переглянути звичайний відбій"
                            >
                                <span className="text-lg">🎴</span>
                                <span className="text-[10px] font-bold text-[#d4af37] mt-0.5">Відбій</span>
                                <span className="text-xs font-bold text-[#f5ebd7] font-mono">
                                    {localGameState.discardPile.length}
                                </span>
                            </button>

                            <button
                                id="btn-inspect-eternal-discard"
                                onClick={() => setInspectPile('eternal')}
                                className="relative w-16 h-22 sm:w-20 sm:h-28 bg-[#2a1424] border-2 border-purple-600/60 rounded-xl flex flex-col items-center justify-center shadow-lg hover:border-purple-400 transition cursor-pointer"
                                title="Переглянути вічний відбій"
                            >
                                <span className="text-lg">☠️</span>
                                <span className="text-[9px] font-bold text-purple-300 mt-0.5">Вічний відбій</span>
                                <span className="text-xs font-bold text-purple-200 font-mono">
                                    {localGameState.eternalDiscardPile?.length || 0}
                                </span>
                            </button>

                            <button
                                id="btn-inspect-hero-discard"
                                onClick={() => setInspectPile('hero')}
                                className="relative w-16 h-22 sm:w-20 sm:h-28 bg-[#2d1b10] border-2 border-amber-500/70 rounded-xl flex flex-col items-center justify-center shadow-lg hover:border-amber-300 transition cursor-pointer"
                                title="Переглянути геройський відбій"
                            >
                                <span className="text-lg">🌟</span>
                                <span className="text-[9px] font-bold text-amber-300 mt-0.5">Геройський</span>
                                <span className="text-xs font-bold text-amber-200 font-mono">
                                    {localGameState.heroDiscardPile?.length || 0}
                                </span>
                            </button>

                            <button
                                id="btn-inspect-my-deck"
                                onClick={() => setInspectPile('my_deck')}
                                className="relative w-16 h-22 sm:w-20 sm:h-28 bg-[#14261d] border-2 border-emerald-600/60 rounded-xl flex flex-col items-center justify-center shadow-lg hover:border-emerald-400 transition cursor-pointer"
                                title="Переглянути свою колоду прикупу"
                            >
                                <span className="text-lg">🃏</span>
                                <span className="text-[9px] font-bold text-emerald-300 mt-0.5">Моя колода</span>
                                <span className="text-xs font-bold text-emerald-200 font-mono">
                                    {(localGameState.prikupDecks?.[0] || localGameState.deck).length}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Status Banner */}
                    {localGameState.statusBanner && (
                        <div className="mx-auto max-w-2xl px-4 py-2 my-1 bg-[#241c16]/90 border border-[#b8860b]/40 rounded-xl text-xs sm:text-sm text-center text-[#f5ebd7] font-medium shadow-md">
                            {localGameState.statusBanner}
                        </div>
                    )}

                    {/* Active Player Hand Area */}
                    <div className="p-3 sm:p-4 bg-[#171310]/90 border-t-2 border-[#b8860b]/40 rounded-t-3xl shadow-2xl">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                                <div className="text-xl p-2 bg-[#2a2018] border border-[#b8860b]/40 rounded-xl">
                                    {activePlayer?.avatar || '👑'}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-[#d4af37] flex items-center gap-1.5">
                                        <span>{activePlayer?.name || 'Ви'}</span>
                                        {activePlayer?.id === localGameState.attackerId && (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 border border-red-700 text-red-300 font-bold">
                                                ⚔️ Атакує
                                            </span>
                                        )}
                                        {activePlayer?.id === localGameState.defenderId && (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 border border-blue-700 text-blue-300 font-bold">
                                                🛡️ Захищається
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-[#c4b5a0] mt-0.5 flex-wrap">
                                        <span>❤️ {activePlayer?.health ?? 500}/500 HP</span>
                                        <span>🛡️ {activePlayer?.armor ?? 200} Захисту</span>
                                        <span>⚡ {activePlayer?.powerPoints ?? 0} Очок сили</span>
                                        {Boolean(activePlayer?.strengthBoost && activePlayer.strengthBoost > 0) && (
                                            <span className="text-amber-300 font-bold bg-gradient-to-r from-red-950/90 to-amber-950/90 border border-amber-500/70 px-2 py-0.5 rounded-full flex items-center gap-1 text-[11px] animate-pulse shadow-md" title="Бонус до сили наступної карти (триває 1 хід)">
                                                ⚔️ +{activePlayer.strengthBoost} Сила (1 хід)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Player Action Buttons (Pass / Take) */}
                            <div className="flex items-center gap-2">
                                {isPlayerTurn && localGameState.turnPlayerId === localGameState.defenderId && (
                                    <button
                                        id="btn-take-cards"
                                        onClick={handleTake}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-800 to-rose-900 border border-red-600 text-white font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
                                    >
                                        <Hand className="w-4 h-4" />
                                        <span>Взяти карти</span>
                                    </button>
                                )}

                                {isPlayerTurn && localGameState.turnPlayerId !== localGameState.defenderId && localGameState.table.length > 0 && (
                                    <button
                                        id="btn-pass-turn"
                                        onClick={handlePass}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-[#b8860b] border border-[#d4af37] text-[#120f0d] font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Бито / Пас</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Hand Overload & Damage Prediction Bar */}
                        {(() => {
                            const handCount = activePlayer?.hand.length || 0;
                            const excessCards = handCount > 22 ? handCount - 22 : 0;
                            const nextTurnNum = (localGameState.turnNumber || 1) + 1;
                            const predictedDamage = excessCards > 0 ? Math.max(1, Math.floor(Math.pow(excessCards + nextTurnNum, 2) / (2 * nextTurnNum))) : 0;

                            if (excessCards > 0) {
                                return (
                                    <div className="mb-2.5 p-2.5 sm:p-3 bg-gradient-to-r from-rose-950 via-red-950/90 to-rose-950 border-2 border-rose-500/80 rounded-2xl text-rose-200 shadow-xl flex items-center justify-between flex-wrap gap-2 animate-pulse">
                                        <div className="flex items-center gap-2">
                                            <Flame className="w-5 h-5 text-rose-400 shrink-0" />
                                            <div>
                                                <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                                                    <span>⚠️ Перевантаження руки:</span>
                                                    <span className="bg-rose-900/90 px-2 py-0.5 rounded-lg border border-rose-500/60 text-amber-300 font-mono">
                                                        +{excessCards} {excessCards === 1 ? 'лишня карта' : excessCards < 5 ? 'лишні карти' : 'лишніх карт'}
                                                    </span>
                                                    <span className="text-[11px] text-slate-300 font-normal">({handCount}/22 карт)</span>
                                                </div>
                                                <div className="text-[11px] text-rose-300 mt-0.5 font-mono">
                                                    Шкода: ((x + y)²) / (2 × y) = (({excessCards} + {nextTurnNum})²) / (2 × {nextTurnNum})
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-xl border border-rose-500/50 shrink-0">
                                            <span className="text-xs font-semibold text-slate-300">Прогноз шкоди на наступному ході:</span>
                                            <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
                                                -{predictedDamage} HP
                                            </span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div className="mb-2.5 px-3 py-1 bg-[#241c16]/80 rounded-xl border border-[#b8860b]/30 flex items-center justify-between text-xs text-[#c4b5a0] flex-wrap gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#d4af37]">🎴 Карти в руці:</span>
                                        <span className="font-mono font-bold text-white">{handCount}/22</span>
                                        <span className="text-[10px] text-emerald-400 font-medium">(Безпечний ліміт)</span>
                                    </div>
                                    <div className="text-[10px] text-[#8c765a]">
                                        Понад 22 карт → Шкода = ((x + y)²) / (2 × y)
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Hand Cards List */}
                        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-[#b8860b]/40 min-h-[110px] sm:min-h-[140px]">
                            {(!activePlayer || activePlayer.hand.length === 0) ? (
                                <div className="py-6 text-center text-[#8c765a] text-xs font-semibold w-full">
                                    У вас немає карт на руках.
                                </div>
                            ) : (
                                activePlayer.hand.map((card, idx) => {
                                    const isValid = checkValidPlay(card);

                                    return (
                                        <div
                                            key={`hand-card-${card.id}-${idx}`}
                                            className={`relative group shrink-0 transition-all duration-300 ${
                                                isValid ? 'hover:-translate-y-2 cursor-pointer' : 'opacity-70 cursor-not-allowed'
                                            }`}
                                            onClick={() => isValid && handleCardClick(card)}
                                        >
                                            <div className="w-16 h-22 sm:w-20 sm:h-28 shadow-xl">
                                                <CardView card={card} />
                                            </div>

                                            {/* Empower button if player has power points */}
                                            {activePlayer.powerPoints > 0 && !card.isEmpowered && (
                                                <button
                                                    onClick={(e) => handleEmpowerCard(card.id, e)}
                                                    className="absolute -top-2 -right-2 p-1 bg-amber-500 hover:bg-amber-400 border border-amber-300 text-black rounded-full text-[10px] font-black shadow-md z-20"
                                                    title="Посилити до козиря (1 ⚡)"
                                                >
                                                    ⚡
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>
            )}

            {/* Floating Combat Log Overlay Drawer */}
            <AnimatePresence>
                {isLogOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 30, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 30, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-16 sm:top-20 right-2 sm:right-6 z-40 w-[calc(100vw-1rem)] sm:w-96 h-[520px] max-h-[calc(100vh-6rem)] shadow-2xl"
                    >
                        <CombatLogView 
                            logs={localGameState.combatLog || []} 
                            onClear={() => {
                                if (!isMultiplayerActive) {
                                    setLocalGameState(prev => ({ ...prev, combatLog: [] }));
                                }
                            }}
                            onClose={() => setIsLogOpen(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Player Count Settings Modal (Solo Mode) */}
            <PlayerCountModal 
                isOpen={isSettingsOpen}
                currentCount={playerCount}
                onSelectCount={(count) => setPlayerCount(count)}
                deckMode={deckMode}
                onSelectDeckMode={(mode) => setDeckMode(mode)}
                onClose={() => startNewGame(playerCount, deckMode)}
            />

            {/* Shop Modal */}
            <ShopModal 
                isOpen={isShopOpen}
                onClose={() => setIsShopOpen(false)}
                powerPoints={activePlayer?.powerPoints || 0}
                shopStock={localGameState.shopStock || INITIAL_SHOP_STOCK}
                onBuy={handleBuyShopItem}
                opponentName={currentDuel?.opponent?.name}
                opponentAvatar={currentDuel?.opponent?.avatar}
                refreshTokens={worldProgress.shopRefreshTokens || 0}
                onRefreshShop={handleRefreshSpellShop}
            />

            {/* Vampire Discard Picker Modal */}
            <AnimatePresence>
                {vampireSpellCaster && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <motion.div 
                            initial={{ scale: 0.9, y: 20, opacity: 0 }} 
                            animate={{ scale: 1, y: 0, opacity: 1 }} 
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="bg-slate-950 border-2 border-red-500/40 rounded-3xl p-6 max-w-xl w-full flex flex-col shadow-2xl overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />
                            
                            <div className="flex justify-between items-center border-b border-red-950 pb-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl animate-pulse">🔮</span>
                                    <h3 className="text-lg font-black tracking-wide text-rose-400 font-serif uppercase">
                                        Закляття Вампіра
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setVampireSpellCaster(null)}
                                    className="p-1.5 bg-red-950/40 hover:bg-red-900/60 rounded-full text-red-200 hover:text-white transition"
                                >
                                    ✕
                                </button>
                            </div>

                            <p className="text-xs text-[#c4b5a0] leading-relaxed mb-4">
                                Оберіть карту зі <strong>звичайного відбою</strong>, яку ви хочете забрати та перетворити на нового Вампіра у вашій руці!
                            </p>

                            <div className="flex-1 overflow-y-auto max-h-[45vh] p-4 bg-red-950/10 rounded-2xl border border-red-900/30 mb-4">
                                {localGameState.discardPile.length === 0 ? (
                                    <div className="text-center py-12 text-red-300/60 text-sm flex flex-col items-center gap-2">
                                        <span>🎴</span>
                                        <span>Звичайний відбій порожній. Немає карт для перетворення!</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-3.5 justify-center">
                                        {localGameState.discardPile.map((c, idx) => (
                                            <div 
                                                key={`vampire-select-card-${c.id}-${idx}`} 
                                                onClick={() => handleVampireDiscardSelect(c)}
                                                className="w-16 h-24 sm:w-20 sm:h-28 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.7)] border border-transparent hover:border-red-500 rounded-lg overflow-hidden"
                                            >
                                                <CardView card={c} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setVampireSpellCaster(null)}
                                    className="w-full py-3 bg-red-950/40 hover:bg-red-900/40 text-red-200 font-bold rounded-xl transition text-sm tracking-wide border border-red-900/30"
                                >
                                    Скасувати
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Tutorial / Rules Modal */}
            <TutorialModal 
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
            />

            {/* Smelting Picker Modal */}
            <SmeltingPickerModal 
                isOpen={!!localGameState.activeSmeltingPicker && localGameState.activeSmeltingPicker.playerId === activePlayer?.id}
                onSelectCard={handleSelectSmeltingCard}
            />

            {/* Discard Inspector Modal */}
            <AnimatePresence>
                {inspectPile && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={() => setInspectPile(null)}
                        className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#1c1815] border-2 border-[#b8860b] p-5 sm:p-6 rounded-3xl flex flex-col gap-4 shadow-2xl max-w-2xl w-full max-h-[80vh] text-[#f5ebd7]"
                        >
                            <div className="flex justify-between items-center border-b border-[#b8860b]/30 pb-3">
                                <div className="flex items-center gap-2">
                                    {inspectPile === 'discard' ? (
                                        <>
                                            <span className="text-xl">🎴</span>
                                            <h3 className="text-lg font-bold text-[#d4af37]">Звичайний відбій ({localGameState.discardPile.length} карт)</h3>
                                        </>
                                    ) : inspectPile === 'eternal' ? (
                                        <>
                                            <span className="text-xl">☠️</span>
                                            <h3 className="text-lg font-bold text-purple-300">Вічний відбій ({localGameState.eternalDiscardPile?.length || 0} карт)</h3>
                                        </>
                                    ) : inspectPile === 'hero' ? (
                                        <>
                                            <span className="text-xl">🌟</span>
                                            <h3 className="text-lg font-bold text-amber-300">Геройський відбій ({localGameState.heroDiscardPile?.length || 0} карт)</h3>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xl">🃏</span>
                                            <h3 className="text-lg font-bold text-emerald-300">Моя колода прикупу ({(localGameState.prikupDecks?.[0] || localGameState.deck).length} карт)</h3>
                                        </>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setInspectPile(null)}
                                    className="p-1.5 bg-[#2a2018] hover:bg-[#3d2e24] rounded-full text-[#c4b5a0] hover:text-white transition"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="text-xs text-[#a08c75]">
                                {inspectPile === 'discard' 
                                    ? 'З цього відбою карти можуть бути воскрешені Кліриком, Священиком, Єпископом або Архієпископом.'
                                    : inspectPile === 'eternal' 
                                    ? 'З вічного відбою карти назавжди знищені і не можуть повернутися у гру.'
                                    : inspectPile === 'hero'
                                    ? 'Спеціальний відбій для Геройських карт. Геройські карти ніколи не потрапляють у простий відбій!'
                                    : 'Це ваша особиста колода прикупу, з якої ви набираєте нові карти під час поєдинку.'}
                            </div>

                            <div className="flex-1 overflow-y-auto max-h-[50vh] p-2 bg-[#120f0d] rounded-2xl border border-[#b8860b]/20">
                                {((inspectPile === 'discard' 
                                    ? localGameState.discardPile 
                                    : inspectPile === 'eternal' 
                                    ? localGameState.eternalDiscardPile 
                                    : inspectPile === 'hero'
                                    ? localGameState.heroDiscardPile
                                    : (localGameState.prikupDecks?.[0] || localGameState.deck)) || []).length === 0 ? (
                                    <div className="text-center py-10 text-[#8c765a] text-sm">Стопка порожня</div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                                        {((inspectPile === 'discard' 
                                            ? localGameState.discardPile 
                                            : inspectPile === 'eternal' 
                                            ? localGameState.eternalDiscardPile 
                                            : inspectPile === 'hero'
                                            ? localGameState.heroDiscardPile
                                            : (localGameState.prikupDecks?.[0] || localGameState.deck)) || []).map((c, idx) => (
                                            <div key={`inspect-card-${c.id}-${idx}`} className="w-14 h-20 sm:w-16 sm:h-24">
                                                <CardView card={c} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setInspectPile(null)}
                                className="w-full py-2.5 bg-[#2a2018] hover:bg-[#3d2e24] text-[#d4af37] font-bold rounded-xl transition text-sm border border-[#b8860b]/40"
                            >
                                Закрити
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Game Over Modal */}
                {localGameState.gameOver && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-[#1c1815] border-2 border-[#b8860b] p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl max-w-md w-full text-center text-[#f5ebd7]"
                        >
                            <Trophy className={`w-20 h-20 ${localGameState.foolPlayerId !== activePlayerId ? 'text-[#d4af37]' : 'text-slate-500'}`} />
                            
                            <div>
                                <h2 className="text-3xl font-black text-[#d4af37] font-['Cinzel']">
                                    {localGameState.foolPlayerId === null ? "🤝 Нічия!" : "Гра закінчена!"}
                                </h2>
                                {localGameState.foolPlayerId !== null ? (
                                    <p className="text-lg text-[#c4b5a0] mt-2">
                                        <span className="font-bold text-rose-400">
                                            {localGameState.players.find(p => p.id === localGameState.foolPlayerId)?.name}
                                        </span> — <span className="font-bold">Поразка! ⚔️</span>
                                    </p>
                                ) : (
                                    <p className="text-lg text-[#c4b5a0] mt-2">
                                        {localGameState.isDraw 
                                            ? "Нічия! Жоден гравець не може походити." 
                                            : "Нічия! Усі гравці вийшли."}
                                    </p>
                                )}
                            </div>

                            {/* Ranking list */}
                            <div className="w-full bg-[#120f0d] p-4 rounded-2xl border border-[#b8860b]/30 flex flex-col gap-2 text-left text-sm">
                                <div className="font-bold text-[#d4af37] border-b border-[#b8860b]/30 pb-2">Результати партії:</div>
                                {localGameState.players.map(p => (
                                    <div key={`result-player-${p.id}`} className="flex justify-between items-center py-1">
                                        <span className="flex items-center gap-2">
                                            <span>{p.avatar}</span>
                                            <span className={p.id === activePlayerId ? 'font-bold text-[#d4af37]' : 'text-[#c4b5a0]'}>{p.name}</span>
                                        </span>
                                        {p.outRank ? (
                                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                                <Award className="w-3.5 h-3.5" /> #{p.outRank} місце
                                            </span>
                                        ) : p.id === localGameState.foolPlayerId ? (
                                            <span className="text-rose-400 font-bold flex items-center gap-1">
                                                <Frown className="w-3.5 h-3.5" /> Поразка
                                            </span>
                                        ) : (
                                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                                                🤝 Нічия
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button 
                                id="btn-play-again"
                                onClick={() => startNewGame()} 
                                className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#120f0d] font-bold rounded-2xl shadow-xl hover:brightness-110 text-lg flex justify-center items-center gap-2 transition"
                            >
                                <RefreshCw className="w-5 h-5" />
                                {isMultiplayerActive ? 'Повернутися в лобі' : 'Зіграти знову'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settlement Modal (Choose Tavern) */}
            {activeSettlement && !activeTavern && (
                <SettlementModal
                    settlement={activeSettlement}
                    progress={worldProgress}
                    onSelectTavern={(tavern) => {
                        setActiveTavern(tavern);
                    }}
                    onClose={() => setActiveSettlement(null)}
                    onCraftCard={handleCraftCard}
                    onProgressUpdate={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onOpenToyShop={() => setIsToyShopOpen(true)}
                />
            )}

            {/* Tavern Modal (Challenge Opponent) */}
            {activeSettlement && activeTavern && (
                <TavernModal
                    settlement={activeSettlement}
                    tavern={activeTavern}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onChallengeOpponent={(opp, activityType) => {
                        if (activityType === 'fantasy_adventure') {
                            tryStartGame(() => {
                                setActiveFantasyAdventure({ opponent: opp, tavern: activeTavern, settlement: activeSettlement! });
                            });
                        } else if (activityType === 'rpg_cards') {
                            handleStartDuel(opp, activeTavern, activeSettlement);
                        } else if (activityType === 'classic_durak_36') {
                            tryStartGame(() => {
                                setActiveClassicDurak({
                                    mode: '36',
                                    opponent: opp,
                                    tavern: activeTavern,
                                    settlement: activeSettlement
                                });
                            });
                        } else if (activityType === 'classic_durak_52') {
                            tryStartGame(() => {
                                setActiveClassicDurak({
                                    mode: '52',
                                    opponent: opp,
                                    tavern: activeTavern,
                                    settlement: activeSettlement
                                });
                            });
                        } else if (activityType === 'dice_poker') {
                            tryStartGame(() => {
                                setActiveDicePoker({
                                    opponent: opp,
                                    tavern: activeTavern,
                                    settlement: activeSettlement
                                });
                            });
                        } else if (activityType === 'tavern_dice') {
                            tryStartGame(() => {
                                setActiveTavernDice({
                                    opponent: opp,
                                    tavern: activeTavern,
                                    settlement: activeSettlement
                                });
                            });
                        } else if (activityType === 'checkers') {
                            tryStartGame(() => {
                                setActiveCheckers({
                                    opponent: opp,
                                    tavern: activeTavern,
                                    settlement: activeSettlement
                                });
                            });
                        } else if (activityType === 'senet') {
                            tryStartGame(() => {
                                setActiveSenet({
                                    opponent: opp,
                                    tavern: activeTavern,
                                    settlement: activeSettlement
                                });
                            });
                        } else if (activityType === 'ur') {
                            tryStartGame(() => {
                                setActiveUr({
                                    opponent: opp,
                                    tavern: activeTavern,
                                    settlement: activeSettlement
                                });
                            });
                        } else if (activityType === 'mehen') {
                            tryStartGame(() => {
                                setActiveMehen({
                                    opponent: opp,
                                    tavern: activeTavern,
                                    settlement: activeSettlement
                                });
                            });
                        } else if (activityType === 'aseb') {
                            tryStartGame(() => {
                                setActiveAseb({
                                    opponent: opp,
                                    tavern: activeTavern,
                                    settlement: activeSettlement
                                });
                            });
                        } else if (activityType === 'battle_pawns_6x12') {
                            tryStartGame(() => {
                                setActiveBattlePawns6x12({
                                    opponent: opp,
                                    tavern: activeTavern,
                                    settlement: activeSettlement,
                                    betAmount: 20
                                });
                            });
                        } else {
                            handleStartDuel(opp, activeTavern, activeSettlement);
                        }
                    }}
                    onChallengeBrawl={(opp) => {
                        tryStartGame(() => {
                            setActiveBrawl({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeFencingSwordShield={(opp) => {
                        tryStartGame(() => {
                            setActiveFencing({
                                mode: 'sword_shield',
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeFencingSwordOnly={(opp) => {
                        tryStartGame(() => {
                            setActiveFencing({
                                mode: 'sword_only',
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeClassicDurak={(opp, mode) => {
                        tryStartGame(() => {
                            setActiveClassicDurak({
                                mode,
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeDicePoker={(opp) => {
                        tryStartGame(() => {
                            setActiveDicePoker({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeTavernDice={(opp) => {
                        tryStartGame(() => {
                            setActiveTavernDice({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 0
                            });
                        });
                    }}
                    onChallengeCoinFlip={(opp) => {
                        tryStartGame(() => {
                            setActiveCoinFlip({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 0
                            });
                        });
                    }}
                    onChallengeD20Dice={(opp) => {
                        tryStartGame(() => {
                            setActiveD20Dice({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 0
                            });
                        });
                    }}
                    onChallengePotionRoulette={(opp) => {
                        tryStartGame(() => {
                            setActivePotionRoulette({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 0
                            });
                        });
                    }}
                    onChallengeLabyrinth={(opp) => {
                        tryStartGame(() => {
                            setActiveLabyrinth({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 0
                            });
                        });
                    }}
                    onChallengeTreasureHunter={(opp) => {
                        tryStartGame(() => {
                            setActiveTreasureHunter({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 0
                            });
                        });
                    }}
                    onChallengeDiceDuel={(opp) => {
                        tryStartGame(() => {
                            setActiveDiceDuel({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 0
                            });
                        });
                    }}
                    onChallengeDiceDuelTournament={(opp) => {
                        tryStartGame(() => {
                            setActiveDiceDuelTournament({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 0
                            });
                        });
                    }}
                    onChallengeCheckers={(opp) => {
                        tryStartGame(() => {
                            setActiveCheckers({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeSenet={(opp) => {
                        tryStartGame(() => {
                            setActiveSenet({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeUr={(opp) => {
                        tryStartGame(() => {
                            setActiveUr({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeMehen={(opp) => {
                        tryStartGame(() => {
                            setActiveMehen({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeAseb={(opp) => {
                        tryStartGame(() => {
                            setActiveAseb({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeFrenchTarot={(opp) => {
                        setPendingBetAction({
                            title: 'Французьке Таро',
                            onConfirm: (bet) => {
                                tryStartGame(() => {
                                    setPendingBetAction(null);
                                    setActiveFrenchTarot({
                                        opponent: opp,
                                        tavern: activeTavern,
                                        settlement: activeSettlement,
                                        betAmount: bet
                                    });
                                }, bet);
                            }
                        });
                    }}
                    onChallengeBlackjack={(opp) => {
                        setPendingBetAction({
                            title: 'Блек Джек',
                            onConfirm: (bet) => {
                                tryStartGame(() => {
                                    setPendingBetAction(null);
                                    setActiveBlackjack({
                                        opponent: opp,
                                        tavern: activeTavern,
                                        settlement: activeSettlement,
                                        betAmount: bet
                                    });
                                }, bet);
                            }
                        });
                    }}
                    onChallengeBlackjackDice={(opp) => {
                        setPendingBetAction({
                            title: 'Блек Джек на кубиках',
                            onConfirm: (bet) => {
                                tryStartGame(() => {
                                    setPendingBetAction(null);
                                    setActiveBlackjackDice({
                                        opponent: opp,
                                        tavern: activeTavern,
                                        settlement: activeSettlement,
                                        betAmount: bet
                                    });
                                }, bet);
                            }
                        });
                    }}
                    onChallengeSteeplechase={() => {
                        setPendingBetAction({
                            title: 'Перегони з перешкодами',
                            onConfirm: (bet) => {
                                tryStartGame(() => {
                                    setPendingBetAction(null);
                                    setActiveHorseRace({
                                        raceType: 'steeplechase',
                                        tavern: activeTavern,
                                        settlement: activeSettlement,
                                        betAmount: bet
                                    });
                                }, bet);
                            }
                        });
                    }}
                    onChallengeFlatRace={() => {
                        setPendingBetAction({
                            title: 'Кінні скачки (2000м)',
                            onConfirm: (bet) => {
                                tryStartGame(() => {
                                    setPendingBetAction(null);
                                    setActiveHorseRace({
                                        raceType: 'flat_horse_race',
                                        tavern: activeTavern,
                                        settlement: activeSettlement,
                                        betAmount: bet
                                    });
                                }, bet);
                            }
                        });
                    }}
                    onChallengeMountedArchery={() => {
                        setPendingBetAction({
                            title: 'Кінна стрільба (2000м)',
                            onConfirm: (bet) => {
                                tryStartGame(() => {
                                    setPendingBetAction(null);
                                    setActiveHorseRace({
                                        raceType: 'mounted_archery',
                                        tavern: activeTavern,
                                        settlement: activeSettlement,
                                        betAmount: bet
                                    });
                                }, bet);
                            }
                        });
                    }}
                    onChallengeArchery={(opp) => {
                        tryStartGame(() => {
                            setActiveArchery({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeJousting={(opp) => {
                        tryStartGame(() => {
                            setActiveJousting({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement
                            });
                        });
                    }}
                    onChallengeChess={(variant, opp) => {
                        tryStartGame(() => {
                            setActiveChess({
                                variant,
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 0
                            });
                        });
                    }}
                    onChallengeToySoldiers={(opp) => {
                        tryStartGame(() => {
                            setActiveToySoldiers({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 10
                            });
                        });
                    }}
                    onChallengeArmyBattle={(opp) => {
                        tryStartGame(() => {
                            setActiveArmyBattle({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 25
                            });
                        });
                    }}
                    onChallengeCheckersWar={(opp, variant = 'checkers_war') => {
                        tryStartGame(() => {
                            setActiveCheckersWar({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 20,
                                variant
                            });
                        });
                    }}
                    onChallengeRpgArmyCheckers={(opp) => {
                        tryStartGame(() => {
                            setActiveRpgArmyCheckers({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 25
                            });
                        });
                    }}
                    onChallengeToyCheckers={(opp, boardSize = 8, movementMode = 'combat') => {
                        const gameType = movementMode === 'checkers_classic' ? 'toy_checkers_classic' : boardSize === 10 ? 'toy_checkers_10x10' : boardSize === 12 ? 'toy_checkers_12x12' : 'toy_checkers';
                        tryStartGame(() => {
                            setActiveToyCheckers({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 10,
                                boardSize,
                                gameType,
                                movementMode
                            });
                        });
                    }}
                    onChallengeToyPawns={(opp, boardSize = 8) => {
                        const gameType = boardSize === 10 ? 'toy_pawns_10x10' : boardSize === 12 ? 'toy_pawns_12x12' : 'toy_pawns';
                        tryStartGame(() => {
                            setActiveToyPawns({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 10,
                                boardSize,
                                gameType
                            });
                        });
                    }}
                    onChallengeWizardBattle={(opp) => {
                        tryStartGame(() => {
                            setActiveWizardBattle({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 15
                            });
                        });
                    }}
                    onChallengeWizardTournament={(opp) => {
                        tryStartGame(() => {
                            setActiveWizardTournament({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 25
                            });
                        });
                    }}
                    onChallengeMagicPawns={(opp, boardSize = 8) => {
                        const gameType = boardSize === 10 ? 'magic_pawns_10x10' : boardSize === 12 ? 'magic_pawns_12x12' : 'magic_pawns';
                        tryStartGame(() => {
                            setActiveMagicPawns({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 15,
                                boardSize,
                                gameType
                            });
                        });
                    }}
                    onChallengeBattlePawns6x12={(opp) => {
                        tryStartGame(() => {
                            setActiveBattlePawns6x12({
                                opponent: opp,
                                tavern: activeTavern,
                                settlement: activeSettlement,
                                betAmount: 20
                            });
                        });
                    }}
                    onOpenToyShop={() => setIsToyShopOpen(true)}
                    onOpenDecompressionMaster={() => setIsDecompressionMasterOpen(true)}
                    onOpenCardMaster={() => setIsCardMasterOpen(true)}
                    onOpenCharacterModal={() => setIsCharacterStatsOpen(true)}
                    onOpenQuests={() => setIsQuestModalOpen(true)}
                    onBackToSettlement={() => setActiveTavern(null)}
                    onCloseToMap={() => {
                        setActiveTavern(null);
                        setActiveSettlement(null);
                    }}
                />
            )}

            {/* Classic Durak Modal (36, 52, 54, 56, Tarot or multi-trump/deck variants) */}
            {activeClassicDurak && (() => {
                const mapModeToActType = (m: DurakGameMode): TavernActivityType => {
                    if (m === '36') return 'classic_durak_36';
                    if (m === '52') return 'classic_durak_52';
                    if (m === '54') return 'classic_durak_54';
                    if (m === '56') return 'classic_durak_56';
                    if (m === 'minor_tarot') return 'classic_durak_minor_tarot';
                    if (m === 'tarot') return 'classic_durak_tarot';
                    if (m === '104_2trumps') return 'durak_104_2trumps';
                    if (m === '52_2trumps') return 'durak_52_2trumps';
                    if (m === '52_3trumps') return 'durak_52_2trumps_plus1trump';
                    if (m === '52_4trumps') return 'durak_52_2trumps_plus2trumps';
                    if (m.startsWith('durak_')) return m as TavernActivityType;
                    return ('durak_' + m) as TavernActivityType;
                };
                const actType = mapModeToActType(activeClassicDurak.mode);
                return (
                    <ClassicDurakModal
                        expectedXpReward={getOpponentXpReward(
                            activeClassicDurak.opponent, 
                            actType, 
                            getOpponentWinCount(worldProgress, activeClassicDurak.opponent.id, actType) + 1
                        )}
                        isOpen={true}
                        mode={activeClassicDurak.mode}
                        opponent={activeClassicDurak.opponent}
                        tavernName={activeClassicDurak.tavern.name}
                        onVictory={() => {
                            handleGenericGameVictory(activeClassicDurak.opponent, activeClassicDurak.tavern, activeClassicDurak.settlement, actType, activeClassicDurak.betAmount);
                            setActiveClassicDurak(null);
                        }}
                        onDefeat={() => {
                            handleGenericGameDefeat(activeClassicDurak.opponent, activeClassicDurak.tavern, activeClassicDurak.settlement, actType, activeClassicDurak.betAmount);
                            setActiveClassicDurak(null);
                        }}
                        onClose={() => setActiveClassicDurak(null)}
                    />
                );
            })()}

            {/* French Tarot Modal */}
            {activeFrenchTarot && (
                <FrenchTarotModal
                    isOpen={true}
                    opponent={activeFrenchTarot.opponent}
                    tavernName={activeFrenchTarot.tavern.name}
                    betAmount={activeFrenchTarot.betAmount}
                    playerGold={worldProgress.playerGold}
                    onVictory={(reward) => {
                        setWorldProgress(prev => ({ ...prev, playerGold: prev.playerGold + reward }));
                        handleGenericGameVictory(activeFrenchTarot.opponent, activeFrenchTarot.tavern, activeFrenchTarot.settlement, 'french_tarot');
                        setActiveFrenchTarot(null);
                    }}
                    onDefeat={(penalty) => {
                        setWorldProgress(prev => ({ ...prev, playerGold: Math.max(0, prev.playerGold - penalty) }));
                        handleGenericGameDefeat(activeFrenchTarot.opponent, activeFrenchTarot.tavern, activeFrenchTarot.settlement, 'french_tarot');
                        setActiveFrenchTarot(null);
                    }}
                    onClose={() => setActiveFrenchTarot(null)}
                />
            )}

            {/* Blackjack Modal */}
            {activeBlackjack && (
                <BlackjackModal
                    isOpen={true}
                    opponent={activeBlackjack.opponent}
                    tavernName={activeBlackjack.tavern.name}
                    betAmount={activeBlackjack.betAmount}
                    playerGold={worldProgress.playerGold}
                    onVictory={(reward) => {
                        setWorldProgress(prev => ({ ...prev, playerGold: prev.playerGold + reward }));
                        handleGenericGameVictory(activeBlackjack.opponent, activeBlackjack.tavern, activeBlackjack.settlement, 'blackjack');
                        setActiveBlackjack(null);
                    }}
                    onDefeat={(penalty) => {
                        setWorldProgress(prev => ({ ...prev, playerGold: Math.max(0, prev.playerGold - penalty) }));
                        handleGenericGameDefeat(activeBlackjack.opponent, activeBlackjack.tavern, activeBlackjack.settlement, 'blackjack');
                        setActiveBlackjack(null);
                    }}
                    onClose={() => setActiveBlackjack(null)}
                />
            )}

            {/* Blackjack Dice Modal */}
            {activeBlackjackDice && (
                <BlackjackDiceModal
                    isOpen={true}
                    opponent={activeBlackjackDice.opponent}
                    tavernName={activeBlackjackDice.tavern.name}
                    betAmount={activeBlackjackDice.betAmount}
                    playerGold={worldProgress.playerGold}
                    onVictory={(reward) => {
                        setWorldProgress(prev => ({ ...prev, playerGold: prev.playerGold + reward }));
                        handleGenericGameVictory(activeBlackjackDice.opponent, activeBlackjackDice.tavern, activeBlackjackDice.settlement, 'blackjack_dice');
                        setActiveBlackjackDice(null);
                    }}
                    onDefeat={(penalty) => {
                        setWorldProgress(prev => ({ ...prev, playerGold: Math.max(0, prev.playerGold - penalty) }));
                        handleGenericGameDefeat(activeBlackjackDice.opponent, activeBlackjackDice.tavern, activeBlackjackDice.settlement, 'blackjack_dice');
                        setActiveBlackjackDice(null);
                    }}
                    onClose={() => setActiveBlackjackDice(null)}
                />
            )}

            {/* Horse Race Modal */}
            {activeHorseRace && (
                <HorseRaceModal
                    isOpen={true}
                    raceType={activeHorseRace.raceType}
                    tavernName={activeHorseRace.tavern.name}
                    progress={worldProgress}
                    betAmount={activeHorseRace.betAmount}
                    onVictory={(reward) => {
                        setWorldProgress(prev => ({ ...prev, playerGold: prev.playerGold + reward }));
                        const dummyOpp: OpponentData = {
                            id: 'horse_master',
                            name: 'Надглядач скачок',
                            title: 'Голова Гір',
                            avatar: '🐎',
                            type: 'champion',
                            rank: 1,
                            difficulty: 'normal',
                            flavorQuote: 'Кінь мчить до мети!',
                            description: 'Надглядач скачок',
                            hp: 100,
                            armor: 10,
                            powerPoints: 50,
                            baseHp: 100,
                            strength: 20,
                            agility: 20,
                            rewards: { gold: 0, powerPoints: 0, reputation: 0, xp: 0 }
                        };
                        const actType: TavernActivityType = activeHorseRace.raceType === 'steeplechase'
                            ? 'steeplechase'
                            : activeHorseRace.raceType === 'mounted_archery'
                            ? 'mounted_archery'
                            : 'flat_horse_race';
                        handleGenericGameVictory(dummyOpp, activeHorseRace.tavern, activeHorseRace.settlement, actType);
                        setActiveHorseRace(null);
                    }}
                    onDefeat={(penalty) => {
                        setWorldProgress(prev => ({ ...prev, playerGold: Math.max(0, prev.playerGold - penalty) }));
                        const dummyOpp: OpponentData = {
                            id: 'horse_master',
                            name: 'Надглядач скачок',
                            title: 'Голова Гір',
                            avatar: '🐎',
                            type: 'champion',
                            rank: 1,
                            difficulty: 'normal',
                            flavorQuote: 'Кінь мчить до мети!',
                            description: 'Надглядач скачок',
                            hp: 100,
                            armor: 10,
                            powerPoints: 50,
                            baseHp: 100,
                            strength: 20,
                            agility: 20,
                            rewards: { gold: 0, powerPoints: 0, reputation: 0, xp: 0 }
                        };
                        const actType: TavernActivityType = activeHorseRace.raceType === 'steeplechase'
                            ? 'steeplechase'
                            : activeHorseRace.raceType === 'mounted_archery'
                            ? 'mounted_archery'
                            : 'flat_horse_race';
                        handleGenericGameDefeat(dummyOpp, activeHorseRace.tavern, activeHorseRace.settlement, actType);
                        setActiveHorseRace(null);
                    }}
                    onClose={() => setActiveHorseRace(null)}
                    onUpdateProgress={(updated) => setWorldProgress(updated)}
                />
            )}

            {/* Betting Modal */}
            {pendingBetAction && (
                <BettingModal
                    isOpen={true}
                    title={pendingBetAction.title}
                    playerGold={worldProgress.playerGold}
                    onConfirm={pendingBetAction.onConfirm}
                    onClose={() => setPendingBetAction(null)}
                />
            )}

            {/* Dice Poker Modal */}
            {activeDicePoker && (
                <DicePokerModal
                    expectedXpReward={getOpponentXpReward(activeDicePoker.opponent, 'dice_poker', getOpponentWinCount(worldProgress, activeDicePoker.opponent.id, 'dice_poker') + 1)}
                    isOpen={true}
                    opponent={activeDicePoker.opponent}
                    tavernName={activeDicePoker.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeDicePoker.opponent, activeDicePoker.tavern, activeDicePoker.settlement, 'dice_poker', activeDicePoker.betAmount);
                        setActiveDicePoker(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeDicePoker.opponent, activeDicePoker.tavern, activeDicePoker.settlement, 'dice_poker', activeDicePoker.betAmount);
                        setActiveDicePoker(null);
                    }}
                    onClose={() => setActiveDicePoker(null)}
                />
            )}

            {/* Tavern Dice Modal */}
            {activeTavernDice && (
                <TavernDiceModal
                    expectedXpReward={getOpponentXpReward(activeTavernDice.opponent, 'tavern_dice', getOpponentWinCount(worldProgress, activeTavernDice.opponent.id, 'tavern_dice') + 1)}
                    isOpen={true}
                    opponent={activeTavernDice.opponent}
                    tavernName={activeTavernDice.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeTavernDice.opponent, activeTavernDice.tavern, activeTavernDice.settlement, 'tavern_dice', activeTavernDice.betAmount);
                        setActiveTavernDice(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeTavernDice.opponent, activeTavernDice.tavern, activeTavernDice.settlement, 'tavern_dice', activeTavernDice.betAmount);
                        setActiveTavernDice(null);
                    }}
                    onClose={() => setActiveTavernDice(null)}
                />
            )}

            {/* Coin Toss Modal */}
            {activeCoinFlip && (
                <CoinTossModal
                    expectedXpReward={getOpponentXpReward(activeCoinFlip.opponent, 'coin_flip', getOpponentWinCount(worldProgress, activeCoinFlip.opponent.id, 'coin_flip') + 1)}
                    isOpen={true}
                    opponent={activeCoinFlip.opponent}
                    tavernName={activeCoinFlip.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeCoinFlip.opponent, activeCoinFlip.tavern, activeCoinFlip.settlement, 'coin_flip', activeCoinFlip.betAmount);
                        setActiveCoinFlip(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeCoinFlip.opponent, activeCoinFlip.tavern, activeCoinFlip.settlement, 'coin_flip', activeCoinFlip.betAmount);
                        setActiveCoinFlip(null);
                    }}
                    onClose={() => setActiveCoinFlip(null)}
                />
            )}

            {/* D20 Dice Modal */}
            {activeD20Dice && (
                <D20DiceModal
                    expectedXpReward={getOpponentXpReward(activeD20Dice.opponent, 'd20_dice', getOpponentWinCount(worldProgress, activeD20Dice.opponent.id, 'd20_dice') + 1)}
                    isOpen={true}
                    opponent={activeD20Dice.opponent}
                    tavernName={activeD20Dice.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeD20Dice.opponent, activeD20Dice.tavern, activeD20Dice.settlement, 'd20_dice', activeD20Dice.betAmount);
                        setActiveD20Dice(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeD20Dice.opponent, activeD20Dice.tavern, activeD20Dice.settlement, 'd20_dice', activeD20Dice.betAmount);
                        setActiveD20Dice(null);
                    }}
                    onClose={() => setActiveD20Dice(null)}
                />
            )}

            {/* Potion Roulette Modal */}
            {activePotionRoulette && (
                <PotionRouletteModal
                    expectedXpReward={getOpponentXpReward(activePotionRoulette.opponent, 'potion_roulette', getOpponentWinCount(worldProgress, activePotionRoulette.opponent.id, 'potion_roulette') + 1)}
                    isOpen={true}
                    opponent={activePotionRoulette.opponent}
                    tavernName={activePotionRoulette.tavern.name}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onVictory={(goldWon?: number) => {
                        const reward = typeof goldWon === 'number' ? goldWon : activePotionRoulette.betAmount;
                        handleGenericGameVictory(activePotionRoulette.opponent, activePotionRoulette.tavern, activePotionRoulette.settlement, 'potion_roulette', reward);
                        setActivePotionRoulette(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activePotionRoulette.opponent, activePotionRoulette.tavern, activePotionRoulette.settlement, 'potion_roulette', activePotionRoulette.betAmount);
                        setActivePotionRoulette(null);
                    }}
                    onClose={() => setActivePotionRoulette(null)}
                />
            )}

            {/* Tavern Labyrinth Modal (Top-Down view, 3-minute timer) */}
            {activeLabyrinth && (
                <TavernLabyrinthModal
                    expectedXpReward={getOpponentXpReward(activeLabyrinth.opponent, 'tavern_labyrinth', getOpponentWinCount(worldProgress, activeLabyrinth.opponent.id, 'tavern_labyrinth') + 1)}
                    isOpen={true}
                    opponent={activeLabyrinth.opponent}
                    tavernName={activeLabyrinth.tavern.name}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onVictory={(bonusGold?: number) => {
                        const reward = (activeLabyrinth.betAmount || 0) + (bonusGold || 0);
                        handleGenericGameVictory(activeLabyrinth.opponent, activeLabyrinth.tavern, activeLabyrinth.settlement, 'tavern_labyrinth', reward);
                        setActiveLabyrinth(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeLabyrinth.opponent, activeLabyrinth.tavern, activeLabyrinth.settlement, 'tavern_labyrinth', activeLabyrinth.betAmount || 0);
                        setActiveLabyrinth(null);
                    }}
                    onClose={() => setActiveLabyrinth(null)}
                />
            )}

            {/* Tavern Treasure Hunter Modal (Platformer) */}
            {activeTreasureHunter && (
                <TavernTreasureHunterModal
                    expectedXpReward={getOpponentXpReward(activeTreasureHunter.opponent, 'tavern_treasure_hunter', getOpponentWinCount(worldProgress, activeTreasureHunter.opponent.id, 'tavern_treasure_hunter') + 1)}
                    isOpen={true}
                    opponent={activeTreasureHunter.opponent}
                    onVictory={(rewardGold: number, xp: number) => {
                        const reward = (activeTreasureHunter.betAmount || 0) + rewardGold;
                        handleGenericGameVictory(activeTreasureHunter.opponent, activeTreasureHunter.tavern, activeTreasureHunter.settlement, 'tavern_treasure_hunter', reward);
                        setActiveTreasureHunter(null);
                    }}
                    onDefeat={(xp: number) => {
                        handleGenericGameDefeat(activeTreasureHunter.opponent, activeTreasureHunter.tavern, activeTreasureHunter.settlement, 'tavern_treasure_hunter', activeTreasureHunter.betAmount || 0);
                        setActiveTreasureHunter(null);
                    }}
                    onClose={() => setActiveTreasureHunter(null)}
                />
            )}

            {/* Dice Duel Modal */}
            {activeDiceDuel && (
                <DiceDuelModal
                    expectedXpReward={getOpponentXpReward(activeDiceDuel.opponent, 'dice_duel', getOpponentWinCount(worldProgress, activeDiceDuel.opponent.id, 'dice_duel') + 1)}
                    isOpen={true}
                    opponent={activeDiceDuel.opponent}
                    tavernName={activeDiceDuel.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeDiceDuel.opponent, activeDiceDuel.tavern, activeDiceDuel.settlement, 'dice_duel', activeDiceDuel.betAmount);
                        setActiveDiceDuel(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeDiceDuel.opponent, activeDiceDuel.tavern, activeDiceDuel.settlement, 'dice_duel', activeDiceDuel.betAmount);
                        setActiveDiceDuel(null);
                    }}
                    onClose={() => setActiveDiceDuel(null)}
                />
            )}

            {/* Dice Tournament Modal */}
            {activeDiceDuelTournament && (
                <DiceTournamentModal
                    expectedXpReward={getOpponentXpReward(activeDiceDuelTournament.opponent, 'dice_duel_tournament', getOpponentWinCount(worldProgress, activeDiceDuelTournament.opponent.id, 'dice_duel_tournament') + 1)}
                    isOpen={true}
                    opponent={activeDiceDuelTournament.opponent}
                    tavernName={activeDiceDuelTournament.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeDiceDuelTournament.opponent, activeDiceDuelTournament.tavern, activeDiceDuelTournament.settlement, 'dice_duel_tournament', activeDiceDuelTournament.betAmount);
                        setActiveDiceDuelTournament(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeDiceDuelTournament.opponent, activeDiceDuelTournament.tavern, activeDiceDuelTournament.settlement, 'dice_duel_tournament', activeDiceDuelTournament.betAmount);
                        setActiveDiceDuelTournament(null);
                    }}
                    onClose={() => setActiveDiceDuelTournament(null)}
                />
            )}

            {/* Checkers Modal */}
            {activeCheckers && (
                <CheckersModal
                    expectedXpReward={getOpponentXpReward(activeCheckers.opponent, 'checkers', getOpponentWinCount(worldProgress, activeCheckers.opponent.id, 'checkers') + 1)}
                    isOpen={true}
                    opponent={activeCheckers.opponent}
                    tavernName={activeCheckers.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeCheckers.opponent, activeCheckers.tavern, activeCheckers.settlement, 'checkers', activeCheckers.betAmount);
                        setActiveCheckers(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeCheckers.opponent, activeCheckers.tavern, activeCheckers.settlement, 'checkers', activeCheckers.betAmount);
                        setActiveCheckers(null);
                    }}
                    onClose={() => setActiveCheckers(null)}
                />
            )}

            {/* Senet Modal */}
            {activeSenet && (
                <SenetModal
                    expectedXpReward={getOpponentXpReward(activeSenet.opponent, 'senet', getOpponentWinCount(worldProgress, activeSenet.opponent.id, 'senet') + 1)}
                    isOpen={true}
                    opponent={activeSenet.opponent}
                    tavernName={activeSenet.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeSenet.opponent, activeSenet.tavern, activeSenet.settlement, 'senet', activeSenet.betAmount);
                        setActiveSenet(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeSenet.opponent, activeSenet.tavern, activeSenet.settlement, 'senet', activeSenet.betAmount);
                        setActiveSenet(null);
                    }}
                    onClose={() => setActiveSenet(null)}
                />
            )}

            {/* Royal Game of Ur Modal */}
            {activeUr && (
                <UrModal
                    expectedXpReward={getOpponentXpReward(activeUr.opponent, 'ur', getOpponentWinCount(worldProgress, activeUr.opponent.id, 'ur') + 1)}
                    isOpen={true}
                    opponent={activeUr.opponent}
                    tavernName={activeUr.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeUr.opponent, activeUr.tavern, activeUr.settlement, 'ur', activeUr.betAmount);
                        setActiveUr(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeUr.opponent, activeUr.tavern, activeUr.settlement, 'ur', activeUr.betAmount);
                        setActiveUr(null);
                    }}
                    onClose={() => setActiveUr(null)}
                />
            )}

            {/* Mehen Serpent Game Modal */}
            {activeMehen && (
                <MehenModal
                    expectedXpReward={getOpponentXpReward(activeMehen.opponent, 'mehen', getOpponentWinCount(worldProgress, activeMehen.opponent.id, 'mehen') + 1)}
                    isOpen={true}
                    opponent={activeMehen.opponent}
                    tavernName={activeMehen.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeMehen.opponent, activeMehen.tavern, activeMehen.settlement, 'mehen', activeMehen.betAmount);
                        setActiveMehen(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeMehen.opponent, activeMehen.tavern, activeMehen.settlement, 'mehen', activeMehen.betAmount);
                        setActiveMehen(null);
                    }}
                    onClose={() => setActiveMehen(null)}
                />
            )}

            {/* Aseb 20 Squares Modal */}
            {activeAseb && (
                <AsebModal
                    expectedXpReward={getOpponentXpReward(activeAseb.opponent, 'aseb', getOpponentWinCount(worldProgress, activeAseb.opponent.id, 'aseb') + 1)}
                    isOpen={true}
                    opponent={activeAseb.opponent}
                    tavernName={activeAseb.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeAseb.opponent, activeAseb.tavern, activeAseb.settlement, 'aseb', activeAseb.betAmount);
                        setActiveAseb(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeAseb.opponent, activeAseb.tavern, activeAseb.settlement, 'aseb', activeAseb.betAmount);
                        setActiveAseb(null);
                    }}
                    onClose={() => setActiveAseb(null)}
                />
            )}

            {/* Archery Competition Modal */}
            {activeArchery && (
                <ArcheryModal
                    isOpen={true}
                    opponent={activeArchery.opponent}
                    progress={worldProgress}
                    tavernName={activeArchery.tavern.name}
                    onProgressUpdate={(updated) => setWorldProgress(updated)}
                    onVictory={() => {
                        handleGenericGameVictory(activeArchery.opponent, activeArchery.tavern, activeArchery.settlement, 'archery', activeArchery.betAmount);
                        setActiveArchery(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeArchery.opponent, activeArchery.tavern, activeArchery.settlement, 'archery', activeArchery.betAmount);
                        setActiveArchery(null);
                    }}
                    onClose={() => setActiveArchery(null)}
                />
            )}

            {/* Jousting Tournament Modal */}
            {activeJousting && (
                <JoustingModal
                    isOpen={true}
                    opponent={activeJousting.opponent}
                    progress={worldProgress}
                    tavernName={activeJousting.tavern.name}
                    onVictory={() => {
                        handleGenericGameVictory(activeJousting.opponent, activeJousting.tavern, activeJousting.settlement, 'jousting', activeJousting.betAmount);
                        setActiveJousting(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeJousting.opponent, activeJousting.tavern, activeJousting.settlement, 'jousting', activeJousting.betAmount);
                        setActiveJousting(null);
                    }}
                    onClose={() => setActiveJousting(null)}
                />
            )}

            {/* Chess Variants Modal */}
            {activeChess && (
                <ChessModal
                    isOpen={true}
                    variant={activeChess.variant}
                    opponent={activeChess.opponent}
                    tavernName={activeChess.tavern.name}
                    onVictory={() => {
                        const variantMap: Record<GameVariant, TavernActivityType> = {
                            standard: 'chess_standard',
                            shatranj: 'shatranj',
                            chaturanga: 'chaturanga',
                            chaturaji: 'chaturaji',
                            tamerlane: 'tamerlane',
                            courier: 'courier',
                            capablanca: 'capablanca',
                            carrera: 'carrera',
                            grasshopper: 'grasshopper',
                            double: 'chess_standard',
                            cheskers: 'cheskers',
                            archchess: 'archchess',
                            archcourier: 'archcourier',
                            senterej: 'senterej',
                            al_adli: 'al_adli',
                            sittuyin: 'sittuyin',
                            makruk: 'makruk',
                            shatar: 'shatar',
                            xiangqi: 'xiangqi',
                            janggi: 'janggi',
                            heian_shogi: 'heian_shogi',
                            sho_shogi: 'sho_shogi',
                            shogi: 'shogi',
                            napoleonic: 'napoleonic',
                            fide_napoleonic: 'fide_napoleonic',
                            napoleon_ottomans: 'napoleon_ottomans',
                            bachelor: 'bachelor'
                        };
                        const actType = variantMap[activeChess.variant] || 'chess_standard';
                        handleGenericGameVictory(activeChess.opponent, activeChess.tavern, activeChess.settlement, actType, activeChess.betAmount);
                        setActiveChess(null);
                    }}
                    onDefeat={() => {
                        const variantMap: Record<GameVariant, TavernActivityType> = {
                            standard: 'chess_standard',
                            shatranj: 'shatranj',
                            chaturanga: 'chaturanga',
                            chaturaji: 'chaturaji',
                            tamerlane: 'tamerlane',
                            courier: 'courier',
                            capablanca: 'capablanca',
                            carrera: 'carrera',
                            grasshopper: 'grasshopper',
                            double: 'chess_standard',
                            cheskers: 'cheskers',
                            archchess: 'archchess',
                            archcourier: 'archcourier',
                            senterej: 'senterej',
                            al_adli: 'al_adli',
                            sittuyin: 'sittuyin',
                            makruk: 'makruk',
                            shatar: 'shatar',
                            xiangqi: 'xiangqi',
                            janggi: 'janggi',
                            heian_shogi: 'heian_shogi',
                            sho_shogi: 'sho_shogi',
                            shogi: 'shogi',
                            napoleonic: 'napoleonic',
                            fide_napoleonic: 'fide_napoleonic',
                            napoleon_ottomans: 'napoleon_ottomans',
                            bachelor: 'bachelor'
                        };
                        const actType = variantMap[activeChess.variant] || 'chess_standard';
                        handleGenericGameDefeat(activeChess.opponent, activeChess.tavern, activeChess.settlement, actType, activeChess.betAmount);
                        setActiveChess(null);
                    }}
                    onClose={() => setActiveChess(null)}
                />
            )}

            {/* 💂‍♂️ Toy Soldiers 15x15 Tactical Modal */}
            {activeToySoldiers && activeToySoldiers.opponent && (
                <ToySoldiersModal
                    isOpen={true}
                    opponent={activeToySoldiers.opponent}
                    tavernName={activeToySoldiers.tavern?.name || 'Таверна'}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onVictory={() => {
                        handleGenericGameVictory(activeToySoldiers.opponent, activeToySoldiers.tavern, activeToySoldiers.settlement, 'toy_soldiers', activeToySoldiers.betAmount);
                        setActiveToySoldiers(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeToySoldiers.opponent, activeToySoldiers.tavern, activeToySoldiers.settlement, 'toy_soldiers', activeToySoldiers.betAmount);
                        setActiveToySoldiers(null);
                    }}
                    onClose={() => setActiveToySoldiers(null)}
                    onOpenShop={() => setIsToyShopOpen(true)}
                    onOpenDecompression={() => setIsDecompressionMasterOpen(true)}
                />
            )}

            {/* 🚩 Army Battle (16 Squads) Tactical Modal */}
            {activeArmyBattle && activeArmyBattle.opponent && (
                <ArmyBattleModal
                    isOpen={true}
                    opponent={activeArmyBattle.opponent}
                    tavern={activeArmyBattle.tavern}
                    tavernName={activeArmyBattle.tavern?.name || 'Таверна'}
                    settlement={activeArmyBattle.settlement}
                    progress={worldProgress}
                    betAmount={activeArmyBattle.betAmount || 25}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onVictory={(finalProgress) => {
                        handleGenericGameVictory(activeArmyBattle.opponent, activeArmyBattle.tavern, activeArmyBattle.settlement, 'army_battle', activeArmyBattle.betAmount, finalProgress);
                        setActiveArmyBattle(null);
                    }}
                    onDefeat={(finalProgress) => {
                        handleGenericGameDefeat(activeArmyBattle.opponent, activeArmyBattle.tavern, activeArmyBattle.settlement, 'army_battle', activeArmyBattle.betAmount, finalProgress);
                        setActiveArmyBattle(null);
                    }}
                    onClose={() => setActiveArmyBattle(null)}
                    onOpenToyShop={() => setIsToyShopOpen(true)}
                    onOpenDecompressionMaster={() => setIsDecompressionMasterOpen(true)}
                />
            )}

            {/* ⚔️🔴 Checkers War Modal (8x8 Dual Board Tactical Checkers & Coin Battle Variants) */}
            {activeCheckersWar && activeCheckersWar.opponent && (
                <CheckersWarModal
                    isOpen={true}
                    opponent={activeCheckersWar.opponent}
                    tavernName={activeCheckersWar.tavern?.name || 'Таверна'}
                    variant={activeCheckersWar.variant || 'checkers_war'}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onVictory={(finalProgress) => {
                        handleGenericGameVictory(
                            activeCheckersWar.opponent,
                            activeCheckersWar.tavern,
                            activeCheckersWar.settlement,
                            activeCheckersWar.variant || 'checkers_war',
                            activeCheckersWar.betAmount,
                            finalProgress
                        );
                        setActiveCheckersWar(null);
                    }}
                    onDefeat={(finalProgress) => {
                        handleGenericGameDefeat(
                            activeCheckersWar.opponent,
                            activeCheckersWar.tavern,
                            activeCheckersWar.settlement,
                            activeCheckersWar.variant || 'checkers_war',
                            activeCheckersWar.betAmount,
                            finalProgress
                        );
                        setActiveCheckersWar(null);
                    }}
                    onClose={() => setActiveCheckersWar(null)}
                    onOpenToyShop={() => setIsToyShopOpen(true)}
                />
            )}

            {/* ⚔️👑 Рольові армійські шашки (8х8 Checkers with G29 Tactical Squad Battles) */}
            {activeRpgArmyCheckers && activeRpgArmyCheckers.opponent && (
                <RpgArmyCheckersModal
                    isOpen={true}
                    opponent={activeRpgArmyCheckers.opponent}
                    tavernName={activeRpgArmyCheckers.tavern?.name || 'Таверна'}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onVictory={(finalProgress) => {
                        handleGenericGameVictory(
                            activeRpgArmyCheckers.opponent,
                            activeRpgArmyCheckers.tavern,
                            activeRpgArmyCheckers.settlement,
                            'rpg_army_checkers',
                            activeRpgArmyCheckers.betAmount,
                            finalProgress
                        );
                        setActiveRpgArmyCheckers(null);
                    }}
                    onDefeat={(finalProgress) => {
                        handleGenericGameDefeat(
                            activeRpgArmyCheckers.opponent,
                            activeRpgArmyCheckers.tavern,
                            activeRpgArmyCheckers.settlement,
                            'rpg_army_checkers',
                            activeRpgArmyCheckers.betAmount,
                            finalProgress
                        );
                        setActiveRpgArmyCheckers(null);
                    }}
                    onClose={() => setActiveRpgArmyCheckers(null)}
                    onOpenToyShop={() => setIsToyShopOpen(true)}
                />
            )}

            {/* 🔴 Combat Checkers Modal (8x8, 10x10, 12x12, classic) */}
            {activeToyCheckers && activeToyCheckers.opponent && (
                <ToyCheckersModal
                    isOpen={true}
                    boardSize={activeToyCheckers.boardSize || 8}
                    movementMode={activeToyCheckers.movementMode || 'combat'}
                    opponent={activeToyCheckers.opponent}
                    tavernName={activeToyCheckers.tavern?.name || 'Таверна'}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onVictory={() => {
                        handleGenericGameVictory(
                            activeToyCheckers.opponent,
                            activeToyCheckers.tavern,
                            activeToyCheckers.settlement,
                            activeToyCheckers.gameType || 'toy_checkers',
                            activeToyCheckers.betAmount
                        );
                        setActiveToyCheckers(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(
                            activeToyCheckers.opponent,
                            activeToyCheckers.tavern,
                            activeToyCheckers.settlement,
                            activeToyCheckers.gameType || 'toy_checkers',
                            activeToyCheckers.betAmount
                        );
                        setActiveToyCheckers(null);
                    }}
                    onClose={() => setActiveToyCheckers(null)}
                    onOpenShop={() => setIsToyShopOpen(true)}
                    onOpenDecompression={() => setIsDecompressionMasterOpen(true)}
                />
            )}

            {/* ♟️ Combat Pawns Modal (8x8, 10x10, 12x12) */}
            {activeToyPawns && activeToyPawns.opponent && (
                <ToyPawnsModal
                    isOpen={true}
                    boardSize={activeToyPawns.boardSize || 8}
                    opponent={activeToyPawns.opponent}
                    tavernName={activeToyPawns.tavern?.name || 'Таверна'}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onVictory={() => {
                        handleGenericGameVictory(
                            activeToyPawns.opponent,
                            activeToyPawns.tavern,
                            activeToyPawns.settlement,
                            activeToyPawns.gameType || 'toy_pawns',
                            activeToyPawns.betAmount
                        );
                        setActiveToyPawns(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(
                            activeToyPawns.opponent,
                            activeToyPawns.tavern,
                            activeToyPawns.settlement,
                            activeToyPawns.gameType || 'toy_pawns',
                            activeToyPawns.betAmount
                        );
                        setActiveToyPawns(null);
                    }}
                    onClose={() => setActiveToyPawns(null)}
                    onOpenShop={() => setIsToyShopOpen(true)}
                    onOpenDecompression={() => setIsDecompressionMasterOpen(true)}
                />
            )}

            {/* 🧙‍♂️ Wizard Battle 1v1 Modal */}
            {activeWizardBattle && activeWizardBattle.opponent && (
                <WizardBattleModal
                    isOpen={true}
                    opponent={activeWizardBattle.opponent}
                    isTournament={false}
                    initialHp={3}
                    onVictory={() => {
                        handleGenericGameVictory(activeWizardBattle.opponent, activeWizardBattle.tavern, activeWizardBattle.settlement, 'wizard_battle', activeWizardBattle.betAmount);
                        setActiveWizardBattle(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeWizardBattle.opponent, activeWizardBattle.tavern, activeWizardBattle.settlement, 'wizard_battle', activeWizardBattle.betAmount);
                        setActiveWizardBattle(null);
                    }}
                    onClose={() => setActiveWizardBattle(null)}
                />
            )}

            {/* 🏆 Wizard Tournament 16 Magicians Modal */}
            {activeWizardTournament && activeWizardTournament.opponent && (
                <WizardBattleModal
                    isOpen={true}
                    opponent={activeWizardTournament.opponent}
                    isTournament={true}
                    initialHp={3}
                    onVictory={() => {
                        handleGenericGameVictory(activeWizardTournament.opponent, activeWizardTournament.tavern, activeWizardTournament.settlement, 'wizard_tournament', activeWizardTournament.betAmount);
                        setActiveWizardTournament(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(activeWizardTournament.opponent, activeWizardTournament.tavern, activeWizardTournament.settlement, 'wizard_tournament', activeWizardTournament.betAmount);
                        setActiveWizardTournament(null);
                    }}
                    onClose={() => setActiveWizardTournament(null)}
                />
            )}

            {/* 🧙‍♂️♟️ Magic Combat Pawns Modal (8x8, 10x10, 12x12) */}
            {activeMagicPawns && activeMagicPawns.opponent && (
                <MagicPawnsModal
                    isOpen={true}
                    boardSize={activeMagicPawns.boardSize || 8}
                    opponent={activeMagicPawns.opponent}
                    tavernName={activeMagicPawns.tavern?.name || 'Таверна'}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onVictory={() => {
                        handleGenericGameVictory(
                            activeMagicPawns.opponent,
                            activeMagicPawns.tavern,
                            activeMagicPawns.settlement,
                            activeMagicPawns.gameType || 'magic_pawns',
                            activeMagicPawns.betAmount
                        );
                        setActiveMagicPawns(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(
                            activeMagicPawns.opponent,
                            activeMagicPawns.tavern,
                            activeMagicPawns.settlement,
                            activeMagicPawns.gameType || 'magic_pawns',
                            activeMagicPawns.betAmount
                        );
                        setActiveMagicPawns(null);
                    }}
                    onClose={() => setActiveMagicPawns(null)}
                    onOpenShop={() => setIsToyShopOpen(true)}
                    onOpenToyShop={() => setIsToyShopOpen(true)}
                    onOpenDecompression={() => setIsDecompressionMasterOpen(true)}
                />
            )}

            {/* ⚔️🔮 Battle Pawns 6x12 Modal (Swords & Magic with RPG card duel) */}
            {activeBattlePawns6x12 && activeBattlePawns6x12.opponent && (
                <BattlePawns6x12Modal
                    isOpen={true}
                    opponent={activeBattlePawns6x12.opponent}
                    tavernName={activeBattlePawns6x12.tavern?.name || 'Таверна'}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onVictory={() => {
                        handleGenericGameVictory(
                            activeBattlePawns6x12.opponent,
                            activeBattlePawns6x12.tavern,
                            activeBattlePawns6x12.settlement,
                            'battle_pawns_6x12',
                            activeBattlePawns6x12.betAmount || 20
                        );
                        setActiveBattlePawns6x12(null);
                    }}
                    onDefeat={() => {
                        handleGenericGameDefeat(
                            activeBattlePawns6x12.opponent,
                            activeBattlePawns6x12.tavern,
                            activeBattlePawns6x12.settlement,
                            'battle_pawns_6x12',
                            activeBattlePawns6x12.betAmount || 20
                        );
                        setActiveBattlePawns6x12(null);
                    }}
                    onClose={() => setActiveBattlePawns6x12(null)}
                    onOpenToyShop={() => setIsToyShopOpen(true)}
                />
            )}

            {/* ✨ Fantasy Adventure Modal */}
            {activeFantasyAdventure && (
                <FantasyAdventureModal
                    opponent={activeFantasyAdventure.opponent}
                    onClose={() => setActiveFantasyAdventure(null)}
                    onComplete={(reward) => {
                        handleGenericGameVictory(
                            activeFantasyAdventure.opponent,
                            activeFantasyAdventure.tavern,
                            activeFantasyAdventure.settlement,
                            'fantasy_adventure',
                            activeFantasyAdventure.betAmount || 0
                        );
                        setActiveFantasyAdventure(null);
                    }}
                />
            )}

            {/* 🏪 Toy Soldiers Shop Modal */}
            {isToyShopOpen && (
                <ToyShopModal
                    isOpen={isToyShopOpen}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onClose={() => setIsToyShopOpen(false)}
                />
            )}

            {/* ✨ Master of Decompression Modal */}
            {isDecompressionMasterOpen && (
                <DecompressionMasterModal
                    isOpen={isDecompressionMasterOpen}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onClose={() => setIsDecompressionMasterOpen(false)}
                />
            )}

            {/* 🧙‍♂️ Card Master Modal */}
            {isCardMasterOpen && (
                <CardMasterModal
                    isOpen={isCardMasterOpen}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onClose={() => setIsCardMasterOpen(false)}
                    onOpenDecompressionMaster={() => {
                        setIsCardMasterOpen(false);
                        setIsDecompressionMasterOpen(true);
                    }}
                />
            )}

            {/* 🎎 Toy Figures Collection Modal */}
            {isToyCollectionOpen && (
                <ToyCollectionModal
                    isOpen={isToyCollectionOpen}
                    progress={worldProgress}
                    onUpdateProgress={(updated) => {
                        setWorldProgress(updated);
                        saveWorldProgress(updated);
                    }}
                    onClose={() => setIsToyCollectionOpen(false)}
                    onOpenToyShop={() => setIsToyShopOpen(true)}
                    onOpenDecompressionMaster={() => setIsDecompressionMasterOpen(true)}
                />
            )}

            {/* Brawl Arena Modal (Fist Fighting) */}
            {activeBrawl && (
                <BrawlArenaModal
                    opponent={activeBrawl.opponent}
                    tavern={activeBrawl.tavern}
                    settlement={activeBrawl.settlement}
                    progress={worldProgress}
                    betAmount={activeBrawl.betAmount}
                    onUpdateProgress={(updated) => setWorldProgress(updated)}
                    onClose={() => setActiveBrawl(null)}
                    onOpenLevelUpModal={() => setIsCharacterStatsOpen(true)}
                    onDefeat={() => {
                        if (lastEncounteredSquad) {
                            handleHospitalTransport();
                        }
                    }}
                />
            )}

            {/* Fencing Arena Modal (Sword & Shield / Sword Only) */}
            {activeFencing && (
                <FencingArenaModal
                    mode={activeFencing.mode}
                    opponent={activeFencing.opponent}
                    tavern={activeFencing.tavern}
                    settlement={activeFencing.settlement}
                    progress={worldProgress}
                    betAmount={activeFencing.betAmount}
                    onUpdateProgress={(updated) => setWorldProgress(updated)}
                    onClose={() => setActiveFencing(null)}
                    onOpenLevelUpModal={() => setIsCharacterStatsOpen(true)}
                    onDefeat={() => {
                        if (lastEncounteredSquad) {
                            handleHospitalTransport();
                        }
                    }}
                    onVictory={() => {
                        if (lastEncounteredSquad && activeSquadTarget) {
                            const updatedSquad: MonsterSquad = {
                                ...lastEncounteredSquad,
                                leader: activeSquadTarget.type === 'leader'
                                    ? { ...lastEncounteredSquad.leader, isDefeated: true }
                                    : lastEncounteredSquad.leader,
                                allies: lastEncounteredSquad.allies.map((ally, idx) =>
                                    activeSquadTarget.type === 'ally' && activeSquadTarget.index === idx
                                        ? { ...ally, isDefeated: true }
                                        : ally
                                )
                            };

                            const isLeaderDefeated = updatedSquad.leader.isDefeated;
                            const areAllAlliesDefeated = updatedSquad.allies.every(a => a.isDefeated);
                            const isEntireSquadDefeated = isLeaderDefeated && areAllAlliesDefeated;

                            if (isEntireSquadDefeated) {
                                // Full victory: banish/respawn squad from map and award rewards
                                setWorldProgress(prev => ({
                                    ...prev,
                                    playerGold: prev.playerGold + (lastEncounteredSquad.rewards.gold || 0),
                                    cardPieces: (prev.cardPieces || 0) + (lastEncounteredSquad.rewards.cardPieces || 0),
                                    playerStats: {
                                        ...prev.playerStats,
                                        xp: (prev.playerStats?.xp || 0) + (lastEncounteredSquad.rewards.xp || 0)
                                    }
                                }));
                                setWanderingSquads(prev => respawnDefeatedSquad(prev, lastEncounteredSquad.id));
                                setLastEncounteredSquad(null);
                                setActiveSquadTarget(null);
                                setActiveFencing(null);
                            } else {
                                // Not all defeated: update squad in state and reopen MonsterEncounterModal for remaining members
                                setWanderingSquads(prev => prev.map(s => s.id === updatedSquad.id ? updatedSquad : s));
                                setActiveMonsterEncounter(updatedSquad);
                                setLastEncounteredSquad(updatedSquad);
                                setActiveSquadTarget(null);
                                setActiveFencing(null);
                            }
                        } else if (lastEncounteredSquad) {
                            // Fallback if target wasn't set
                            setWorldProgress(prev => ({
                                ...prev,
                                playerGold: prev.playerGold + (lastEncounteredSquad.rewards.gold || 0),
                                cardPieces: (prev.cardPieces || 0) + (lastEncounteredSquad.rewards.cardPieces || 0),
                                playerStats: {
                                    ...prev.playerStats,
                                    xp: (prev.playerStats?.xp || 0) + (lastEncounteredSquad.rewards.xp || 0)
                                }
                            }));
                            setWanderingSquads(prev => respawnDefeatedSquad(prev, lastEncounteredSquad.id));
                            setLastEncounteredSquad(null);
                            setActiveSquadTarget(null);
                            setActiveFencing(null);
                        }
                    }}
                />
            )}

            {/* Character Stats & Upgrade Modal */}
            {isCharacterStatsOpen && (
                <CharacterStatsModal
                    progress={worldProgress}
                    onUpdateProgress={(updated) => setWorldProgress(updated)}
                    onClose={() => setIsCharacterStatsOpen(false)}
                />
            )}

            {/* Deck Builder Modal */}
            {isDeckBuilderOpen && (
                <DeckBuilderModal
                    isOpen={isDeckBuilderOpen}
                    onClose={() => setIsDeckBuilderOpen(false)}
                    progress={worldProgress}
                    onSaveDeck={handleSaveDeck}
                />
            )}

            {/* Wandering Monster Squad Encounter Modal */}
            {activeMonsterEncounter && (
                <MonsterEncounterModal
                    squad={activeMonsterEncounter}
                    progress={worldProgress}
                    onUpdateProgress={setWorldProgress}
                    onSquadUpdate={(updatedSquad) => {
                        setWanderingSquads(prev => prev.map(s => s.id === updatedSquad.id ? updatedSquad : s));
                        setActiveMonsterEncounter(updatedSquad);
                    }}
                    onStartCombat={(squad, targetType, allyIndex, preemptiveDamage) => handleStartMonsterCombat(squad, targetType, allyIndex, preemptiveDamage)}
                    onStartGoldBoxCombat={(squad, preemptiveDamage) => handleStartMonsterCombat(squad, 'leader', undefined, preemptiveDamage)}
                    onSquadDefeated={(defeatedSquad) => {
                        setWorldProgress(prev => ({
                            ...prev,
                            playerGold: prev.playerGold + (defeatedSquad.rewards.gold || 0),
                            cardPieces: (prev.cardPieces || 0) + (defeatedSquad.rewards.cardPieces || 0),
                            playerStats: {
                                ...prev.playerStats,
                                xp: (prev.playerStats?.xp || 0) + (defeatedSquad.rewards.xp || 0)
                            }
                        }));
                        triggerQuestEvent({
                            type: 'monster_defeated',
                            monsterName: defeatedSquad.name,
                            monsterCategory: defeatedSquad.category
                        });
                        setWanderingSquads(prev => respawnDefeatedSquad(prev, defeatedSquad.id));
                        setActiveMonsterEncounter(null);
                        setLastEncounteredSquad(null);
                    }}
                    onFleeSuccess={(squad) => handleFleeFromMonster(squad)}
                    onFleeFailed={() => {}}
                    onClose={() => setActiveMonsterEncounter(null)}
                />
            )}

            {/* ⚔️ Gold Box Tactical Battle Engine Modal */}
            {activeGoldBoxCombat && (
                <GoldBoxCombatModal
                    squad={activeGoldBoxCombat.squad}
                    progress={worldProgress}
                    preemptiveDamage={activeGoldBoxCombat.preemptiveDamage}
                    onUpdateProgress={setWorldProgress}
                    onVictory={(rewards) => {
                        setWorldProgress(prev => ({
                            ...prev,
                            playerGold: prev.playerGold + (rewards.gold || 0),
                            cardPieces: (prev.cardPieces || 0) + (rewards.cardPieces || 0),
                            playerReputation: (prev.playerReputation || 0) + (rewards.reputation || 0),
                            playerStats: {
                                ...prev.playerStats,
                                xp: (prev.playerStats?.xp || 0) + (rewards.xp || 0)
                            }
                        }));
                        triggerQuestEvent({
                            type: 'monster_defeated',
                            monsterName: activeGoldBoxCombat.squad.name,
                            monsterCategory: activeGoldBoxCombat.squad.category
                        });
                        setWanderingSquads(prev => respawnDefeatedSquad(prev, activeGoldBoxCombat.squad.id));
                        setActiveGoldBoxCombat(null);
                        setLastEncounteredSquad(null);
                        setActiveMonsterEncounter(null);
                    }}
                    onDefeat={() => {
                        setActiveGoldBoxCombat(null);
                        handleHospitalTransport();
                    }}
                    onFlee={() => {
                        const squad = activeGoldBoxCombat.squad;
                        setActiveGoldBoxCombat(null);
                        handleFleeFromMonster(squad);
                    }}
                    onClose={() => setActiveGoldBoxCombat(null)}
                />
            )}

            {/* Wandering Gambler Encounter Modal */}
            {activeWanderingGambler && (
                <WanderingGamblerModal
                    gambler={activeWanderingGambler}
                    playerGold={worldProgress.playerGold}
                    onStartGame={(gambler, betAmount, targetType, allyIndex) => handleStartGamblerGame(gambler, betAmount, targetType, allyIndex)}
                    onClose={() => setActiveWanderingGambler(null)}
                />
            )}

            {/* Duel Result Modal */}
            {duelResult && (
                <DuelResultModal
                    isVictory={duelResult.isVictory}
                    opponent={duelResult.opponent}
                    tavern={duelResult.tavern}
                    settlement={duelResult.settlement}
                    isTavernNowConquered={duelResult.isTavernNowConquered}
                    unlockedNextName={duelResult.unlockedNextName}
                    xpEarned={duelResult.xpEarned}
                    didLevelUp={duelResult.didLevelUp}
                    newLevel={duelResult.newLevel}
                    pointsGained={duelResult.pointsGained}
                    winsAgainstOpponent={duelResult.winsAgainstOpponent}
                    becameNpc={duelResult.becameNpc}
                    cardsGained={duelResult.cardsGained}
                    cardPiecesGained={duelResult.cardPiecesGained}
                    blankCardsGained={duelResult.blankCardsGained}
                    discardCountProcessed={duelResult.discardCountProcessed}
                    earnedShopToken={duelResult.earnedShopToken}
                    onRematch={handleRematch}
                    onReturnToTavern={handleReturnToTavern}
                    onReturnToMap={handleReturnToMap}
                    onOpenCharacterModal={() => setIsCharacterStatsOpen(true)}
                />
            )}

            {/* Reset Progress Confirmation Dialog */}
            {isResetConfirmOpen && (
                <div 
                    id="modal-reset-confirm"
                    className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1c1815] border-2 border-rose-800 p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl max-w-md w-full text-center text-[#f5ebd7] relative overflow-hidden"
                    >
                        {/* Decorative background accent */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-900 via-rose-600 to-rose-900" />
                        
                        <div className="w-16 h-16 rounded-full bg-rose-950/50 flex items-center justify-center border border-rose-700/50 mb-2">
                            <RefreshCw className="w-8 h-8 text-rose-500 animate-spin-slow" />
                        </div>
                        
                        <div>
                            <h2 className="text-2xl font-black text-rose-400 font-['Cinzel'] uppercase tracking-wider">
                                Скинути весь прогрес?
                            </h2>
                            <p className="text-[#c4b5a0] mt-3 text-sm leading-relaxed">
                                Ви впевнені, що хочете розпочати кампанію спочатку? Весь ваш поточний прогрес, золото, характеристики та переможені супротивники будуть безповоротно стерті.
                            </p>
                        </div>

                        <div className="flex gap-4 w-full mt-2">
                            <button
                                id="btn-cancel-reset"
                                onClick={() => setIsResetConfirmOpen(false)}
                                className="flex-1 py-3 bg-[#2a221b] hover:bg-[#3d2f24] text-[#c4b5a0] hover:text-[#f5ebd7] font-bold rounded-xl border border-[#b8860b]/30 transition"
                            >
                                Скасувати
                            </button>
                            <button
                                id="btn-confirm-reset"
                                onClick={() => {
                                    setIsResetConfirmOpen(false);
                                    resetCampaignProgress();
                                }}
                                className="flex-1 py-3 bg-gradient-to-r from-rose-800 to-rose-600 hover:brightness-110 text-[#f5ebd7] font-bold rounded-xl shadow-lg border border-rose-500/30 transition"
                            >
                                Скинути
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Insufficient Gold Warning Dialog */}
            {noGoldError && (
                <div 
                    id="modal-no-gold-error"
                    className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#1c1815] border-2 border-[#b8860b] p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl max-w-md w-full text-center text-[#f5ebd7] relative overflow-hidden"
                    >
                        {/* Decorative background accent */}
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-800 via-[#d4af37] to-amber-800" />
                        
                        <div className="w-16 h-16 rounded-full bg-amber-950/50 flex items-center justify-center border border-amber-700/50 mb-2">
                            <Coins className="w-8 h-8 text-[#d4af37]" />
                        </div>
                        
                        <div>
                            <h2 className="text-2xl font-black text-[#d4af37] font-['Cinzel'] uppercase tracking-wider">
                                Недостатньо золота!
                            </h2>
                            <p className="text-[#c4b5a0] mt-3 text-sm leading-relaxed">
                                Для початку гри у таверні потрібно сплатити обов'язковий вступний внесок — <span className="font-bold text-[#d4af37]">10 золотих монет</span>.
                            </p>
                            <p className="text-[#c4b5a0]/70 mt-2 text-xs leading-relaxed">
                                (Якщо ви повністю збанкрутували, ви можете скористатися кнопкою "Скинути прогрес" у верхньому меню, щоб почати гру заново зі стартовим золотом).
                            </p>
                        </div>

                        <button
                            id="btn-close-no-gold-modal"
                            onClick={() => setNoGoldError(false)}
                            className="w-full py-3 bg-gradient-to-r from-[#b8860b] to-[#d4af37] text-[#120f0d] font-bold rounded-xl shadow-md hover:brightness-110 transition"
                        >
                            Зрозуміло
                        </button>
                    </motion.div>
                </div>
            )}

            {/* 📜 Quest Journal & Notice Board Modal */}
            <QuestModal
                isOpen={isQuestModalOpen}
                onClose={() => setIsQuestModalOpen(false)}
                progress={worldProgress}
                onUpdateProgress={(updated) => {
                    setWorldProgress(updated);
                    saveWorldProgress(updated);
                }}
                currentSettlement={activeSettlement}
                currentTavern={activeTavern}
                onTrackTargetOnMap={(coords) => {
                    setWorldProgress(prev => {
                        const updated = {
                            ...prev,
                            playerPosition: { ...coords, isMoving: false }
                        };
                        saveWorldProgress(updated);
                        return updated;
                    });
                }}
            />
        </div>
    );
}

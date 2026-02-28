import { TerrainType } from "../maps/terrain.js";
// World
export const TERRAIN_BASE_DEFENSE: Record<TerrainType, number> = {
  GRASS: 1,
  ROCK: 2,
  MOUNTAIN: 3,
  BEDROCK: 999,
};
export const PLAYER_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#eab308", // yellow
  "#a855f7", // purple
  "#14b8a6", // teal
  "#ba1ec9",
  "#f78f06",
  "#76cc30",
];

// CONFLICT
export const BASE_CAPTURE_COST = 5;
export const CAPTURE_RATE = 1;
export const DEFEND_COST_RATIO = 0.8

export const DEFENSE_HEAT_MAX = 3;          // Max number of escalations
export const DEFENSE_HEAT_DECAY_MS = 10000; // 10 seconds to reset
export const DEFENSE_COST_INCREMENT = 0.2;  // +20% cost per click

export const TILE_ATTACK_COOLDOWN = 1000;

export const TILES_UNTIL_MAX_ATTACKTIME_INCREASE = 30
export const MAX_ATTACKTIME_INCREASE = 0.8 // in seconds

// Economy
export const STARTING_GOLD = 10
export const STARTING_ARMY = 15

export const BUILDING_COST = {
  BARRACKS: 30,
  FORT: 25,
  HOUSE: 20,
} as const;

export const BUILDING_LIMIT = {
  BARRACKS: 2,
  FORT: 4,
  HOUSE: 10
} as const;

export const BUILDING_CONSTRUCTION_TIME = {
  BARRACKS: 8,
  FORT: 5,
  HOUSE: 3
} as const;

export const BUILDING_DEMOLISH_TIME = {
  BARRACKS: 10,
  FORT: 8,
  HOUSE: 5
} as const;

export const DEMOLISH_REFUND_RATIO = 0.5;

export const ARMY_CAP_PER_TILE = 2;
export const BASE_ARMY_MAX = 40;
export const BASE_GOLD_MAX = 100;

export const GOLD_PER_TILE = 0.01;
export const ARMY_PER_TILE = 0.02
export const GOLD_PASSIVE = 0.1;
export const ARMY_PASSIVE = 1;

export const NEUTRAL_TILE_CAPTURE_GOLD = 1; // gold gained per defense of captured neutral tile
export const PLAYER_KILL_GOLD_REWARD = 10;

export const ARMY_PEAK = 0.6; 
export const GOLD_PEAK = 0.4; 

// BUILDING EFFECTS
export const BASE_TILE_DEFENSE = 1;
export const HQ_DEFENSE_SELF = 4;
export const HQ_DEFENSE_ADJACENT = 2;
export const FORT_DEFENSE_SELF = 2;
export const FORT_DEFENSE_ADJACENT = 1;
export const BARRACKS_ARMY_BONUS = 1.2;
export const HOUSE_ARMY_CAP_BONUS = 10;

export const FORT_LIMIT = 3
export const BARRACKS_LIMIT = 2
export const HOUSE_LIMIT = 5

// SYSTEM
export const PING_TIMEOUT = 10_000;
export const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
];


// AI
export const PIVOT_DIST = 4; // comform zone - higher pivot = ai want to maintain bigger base
export const STEEPNESS = 1.6; // impactfullness of distance - higher steepness = ai cares more about close tiles then further ones
export const TIME_TO_AI_AUTOFILL = 5000; // in ms

// preset names for players and bots
export const GAMER_NAMES: string[] = [
  // --- COMPETITIVE / SWEATY ---
  "ShadowByte", "PixelKnight", "CyberMage", "NeonReaper", "VoidWalker",
  "AlphaZen", "RoguePulse", "IronGlimpse", "FrostWarden", "ZenithZero",
  "SolarFlare", "LunaStatic", "StormViper", "EchoSlayer", "TitanCore",
  "GlitchMaster", "RiftRunner", "NovaStrike", "CobaltRush", "AeroGhost",
  "VortexVandal", "HyperNova", "WildCard", "ApexPredator", "SilentScope",
  "FatalError", "GhostProtocol", "OmegaShift", "PrimalFury", "VectorVelocity",
  
  // --- CASUAL / FUN ---
  "MysticPanda", "GrimFable", "SleepySloth", "AngryBirdie", "DogeLord", 
  "LofiVibes", "PizzaThief", "BobaFettuccine", "TacoTuesday", "CerealKiller",
  "DuckingGoose", "MarshmallowMadness", "PoptartPower", "BubbleTeaBot", "SofaHero",
  "LaundryDay", "WiFiWarrior", "Buffered", "LowBattery", "LaggyLarry",
  "ButtonMasher", "JoystickJunkie", "RespawnRepeat", "NoobSlayer99", "LeetSpoke",

  // --- DARK / EDGY ---
  "AbyssWatcher", "DoomSpiral", "NightCrawler", "SoulFragment", "BloodMoon",
  "HollowPoint", "CursedRelic", "ShadowPhaze", "WraithKing", "PhantomEdge",
  "NecroDancer", "DarkMatter", "EclipseEnd", "BoneCollector", "VenomSting",
  "ChaosTheory", "Oblivion", "GrimRevolt", "SkullBash", "TerrorByte",

  // --- SCI-FI / TECH ---
  "CircuitBreaker", "DataStream", "BinaryBeast", "NeuralNetwork", "NanoBlade",
  "PlasmaPulse", "SiliconSoul", "MacroWave", "BitCrusher", "LogicGate",
  "KernelPanic", "SynapseSnap", "OverClocked", "Mainframe", "CyberDrone",
  "StaticShock", "Voltage", "GridRunner", "BitShifter", "FireWall",

  // --- ELEMENTS / NATURE ---
  "MagmaMelt", "ArcticFox", "TerraForm", "CloudNine", "ThunderBolt",
  "DeepCurrent", "SolarWind", "AshFall", "QuakeMaker", "SkyBound",
  "WildFire", "FrostBite", "StoneCold", "MistWalker", "StarGazer"
];

export const TICK_RATE = 100
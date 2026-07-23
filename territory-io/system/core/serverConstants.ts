import { TerrainType } from "../../shared/index.js";

// Server-only world setup
export const TERRAIN_BASE_DEFENSE: Record<TerrainType, number> = {
  GRASS: 1,
  DESERT: 2,
  MOUNTAIN: 3,
  WATER: 999,
  BEDROCK: 999,
};

export const PLAYER_COLORS = [
  "#ef4444", // 1. Crimson Red
  "#3b4ef6", // 2. Bright Royal Blue
  "#22c55e", // 3. Neon Emerald Green
  "#eab308", // 4. Vibrant Gold / Yellow
  "#a855f7", // 5. Deep Purple
  "#f97316", // 6. Bright Orange
  "#06b6d4", // 7. Electric Cyan / Light Blue
  "#ec4899", // 8. Hot Pink
  "#84cc16", // 9. Lime Green
  "#d946ef", // 10. Magenta / Orchid
  "#007fb1", // 11. Teal
  "#f43f5e", // 12. Raspberry Red
  "#6366f1", // 13. Indigo
  "#fa3f15", // 14. Bright Lemon Yellow
  "#38bdf8", // 15. Sky Blue
  "#f99d52", // 16. Pastel Apricot / Peach
];

export const MIN_HQ_DISTANCE = 3;

// AI
export const PIVOT_DIST = 4;
export const STEEPNESS = 1.6;
export const TIME_TO_AI_AUTOFILL = 5_000;

export const GAMER_NAMES: string[] = [
  "ShadowByte", "PixelKnight", "CyberMage", "NeonReaper", "VoidWalker",
  "AlphaZen", "RoguePulse", "IronGlimpse", "FrostWarden", "ZenithZero",
  "SolarFlare", "LunaStatic", "Stormv1per", "EchoSlayer", "TitanCore",
  "GlitchMaster", "RiftRunner", "NovaStrike", "CobaltRush", "AeroGhost",
  "VortexVandal", "HyperNova", "WildCard", "ApexPredator", "SilentScope",
  "FatalError", "GhostProtocol", "OmegaShift", "PrimalFury", "VectorVelocity",

  "MysticPanda", "GrimFable", "SleepySloth", "AngryBirdie", "DogeLord",
  "LofiVibes", "PizzaThief", "BobaFettuccine", "TacoTuesday", "CerealKiller",
  "DuckingGoose", "Marshmallowmmadness", "PoptartPower", "BubbleTeaBot", "SofaHero",
  "LaundryDay", "WiFiWarrior", "Buffered", "LowBattery", "LaggyLarry",
  "ButtonMasher", "JoystickJunkie", "RespawnRepeat", "NoobSlayer99", "LeetSpoke",

  "AbyssWatcher", "DoomSpiral", "NightCrawler", "SoulFragment", "BloodMoon",
  "HollowPoint", "CursedRelic", "ShadowPhaze", "WraithKing", "PhantomEdge",
  "NecroDancer", "DarkMatter", "EclipseEnd", "BoneCollector", "VenomSting",
  "ChaosTheory", "Oblivion", "GrimRevolt", "SkullBash", "TerrorByte",

  "CircuitBreaker", "DataStream", "BinaryBeast", "NeuralNetwork", "NanoBlade",
  "PlasmaPulse", "SiliconSoul", "MacroWave", "BitCrusher", "LogicGate",
  "KernelPanic", "SynapseSnap", "OverClocked", "Mainframe", "CyberDrone",
  "StaticShock", "Voltage", "GridRunner", "BitShifter", "FireWall",

  "MagmaMelt", "ArcticFox", "TerraForm", "CloudNine", "ThunderBolt",
  "DeepCurrent", "SolarWind", "AshFall", "QuakeMaker", "SkyBound",
  "WildFire", "FrostBite", "StoneCold", "MistWalker", "StarGazer"
];

const GOLD_SCALE = 1;

// CONFLICT
export const BASE_CAPTURE_COST = 5;
export const CAPTURE_RATE = 1;
export const DEFEND_COST_RATIO = 0.8
export const DEFENSE_HEAT_MAX = 3;          // Max number of escalations
export const DEFENSE_HEAT_DECAY_MS = 10000; // 10 seconds to reset
export const DEFENSE_COST_INCREMENT = 0.2;  // +20% cost per click
export const TILE_ATTACK_COOLDOWN = 1000;

export const TILES_UNTIL_MAX_ATTACKTIME_INCREASE = 45
export const MAX_ATTACKTIME_INCREASE = 1 // in seconds

// effects
export const EFFECT_COSTS = {
  ATTACK_SPEED: 30 * GOLD_SCALE,
  ARMY_GAIN_BUFF: 40 * GOLD_SCALE,
}

export const EFFECT_DURATIONS = { // null for permanent
  ATTACK_SPEED: 30_000, // 30s
  ARMY_GAIN_BUFF: 30_000,
}

//effect strenghts
export const EFFECT_STRENGTHS = {
  ATTACK_SPEED: 1.5, // multiplier for player attack speed
  ARMY_GAIN_BUFF: 2.0,
} 

// Economy
export const STARTING_GOLD = 10 * GOLD_SCALE
export const STARTING_ARMY = 1000

export const BUILDING_COST = {
  BARRACKS: 30 * GOLD_SCALE,
  FORT: 25 * GOLD_SCALE,
  HOUSE: 20 * GOLD_SCALE,
  LABORATORY: 50 * GOLD_SCALE,
  SIEGE_OUTPOST: 35 * GOLD_SCALE
} as const;

export const BUILDING_LIMIT = {
  BARRACKS: 2,
  FORT: 4,
  HOUSE: 10,
  LABORATORY: 1,
  SIEGE_OUTPOST: 3
} as const;

export const BUILDING_CONSTRUCTION_TIME = {
  BARRACKS: 8,
  FORT: 5,
  HOUSE: 3,
  LABORATORY: 10,
  SIEGE_OUTPOST: 12
} as const;

export const BUILDING_DEMOLISH_TIME = {
  BARRACKS: 10,
  FORT: 8,
  HOUSE: 5,
  LABORATORY: 12,
  SIEGE_OUTPOST: 14
} as const;

export const DEMOLISH_REFUND_RATIO = 0.5;

export const ARMY_CAP_PER_TILE = 2;
export const BASE_ARMY_MAX = 40;
export const BASE_GOLD_MAX = 100 * GOLD_SCALE;

export const GOLD_PER_TILE = 0.05 * GOLD_SCALE;
export const ARMY_PER_TILE = 0.02
export const GOLD_PASSIVE = 0.5 * GOLD_SCALE;
export const ARMY_PASSIVE = 1;

export const ARMY_PEAK = 0.6; 
export const GOLD_PEAK = 0.4; 

// BUILDING EFFECTS
export const BASE_TILE_DEFENSE = 1;
export const HQ_DEFENSE_SELF = 4;
export const HQ_DEFENSE_ADJACENT = 2;
export const FORT_DEFENSE_SELF = 2;
export const FORT_DEFENSE_ADJACENT = 1;
export const BARRACKS_ARMY_BONUS = 1;
export const HOUSE_ARMY_CAP_BONUS = 10;

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
export const ROOM_CODE_LENGTH = 6;

export const TICK_RATE = 100 
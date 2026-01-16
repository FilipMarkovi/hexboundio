import { TerrainType } from "../maps/terrain.js";
// World
export const MAP_RADIUS = 6;
export const TERRAIN_BASE_DEFENSE: Record<TerrainType, number> = {
  GRASS: 1,
  ROCK: 2,
  MOUNTAIN: 3,
  BEDROCK: 999
};
export const PLAYER_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#eab308", // yellow
  "#a855f7", // purple
  "#14b8a6", // teal
];

export const BASE_CAPTURE_COST = 5;
export const CAPTURE_RATE = 1;
export const DEFEND_COST_RATIO = 0.8

// Economy
export const STARTING_GOLD = 400
export const STARTING_ARMY = 100
export const FORT_COST = 25;
export const BARRACKS_COST = 30;

export const BUILDING_COST = {
  BARRACKS: 30,
  FORT: 25,
} as const;
export const DEMOLISH_REFUND_RATIO = 0.5;

export const ARMY_CAP_PER_TILE = 2;
export const BASE_ARMY_MAX = 100;
export const BASE_GOLD_MAX = 999;

export const GOLD_PER_TILE = 0.1;
export const GOLD_PASSIVE = 1;
export const ARMY_PASSIVE = 1;

// BUILDING EFFECTS
export const BASE_TILE_DEFENSE = 1;
export const HQ_DEFENSE_SELF = 4;
export const HQ_DEFENSE_ADJACENT = 2;
export const FORT_DEFENSE_SELF = 2;
export const FORT_DEFENSE_ADJACENT = 1;
export const BARRACKS_ARMY_BONUS = 1.5;

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


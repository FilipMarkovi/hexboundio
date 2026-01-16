// shared/maps/map_default.ts
import type { GameMapDefinition } from "./types.js";

export const mapDefault: GameMapDefinition = {
  id: "default",
  name: "default",

  hexes: [
    { q: 0, r: 0, terrain: "GRASS" },
    { q: 1, r: 0, terrain: "GRASS" },
    { q: 2, r: 0, terrain: "MOUNTAIN" },

    { q: 0, r: 1, terrain: "GRASS" },
    { q: 1, r: 1, terrain: "ROCK" },
    { q: 2, r: 1, terrain: "GRASS" }
  ],

  hqSpawns: [
    { q: 0, r: 0 },
    { q: 2, r: 1 }
  ]
};

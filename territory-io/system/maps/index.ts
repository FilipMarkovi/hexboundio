// shared/maps/index.ts
import { GameMapDefinition } from "./types.js";
import { barrier } from "./instances/barrier.js";
import { oasis } from "./instances/oasis.js";
import { thelakes } from "./instances/thelakes.js";
import { greatriver } from "./instances/thegreatriver.js";


export const MAPS = new Map<string, GameMapDefinition>([
  ["barrier", barrier],
  ["oasis", oasis],
  ["thelakes", thelakes],
  ["greatriver", greatriver]
]);

export type MapId = typeof MAPS extends Map<infer K, any> ? K : never;

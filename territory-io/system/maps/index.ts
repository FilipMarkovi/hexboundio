// shared/maps/index.ts
import { GameMapDefinition } from "./types.js";
import { octagon } from "./instances/octagon.js";
import { amazon } from "./instances/amazon.js";

export const MAPS = new Map<string, GameMapDefinition>([
  ["octagon", octagon],
  ["amazon", amazon]

]);

export type MapId = typeof MAPS extends Map<infer K, any> ? K : never;

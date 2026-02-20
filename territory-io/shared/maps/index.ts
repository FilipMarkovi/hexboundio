// shared/maps/index.ts
import { mapDefault } from "./instances/mapDefault";
import { butterflyMap } from "./instances/butterflyMap";
import { ironCrossMap } from "./instances/ironCrossMap";
import { mountainsMap } from "./instances/mountainsMap";
import { GameMapDefinition } from "./types";

export const MAPS = new Map<string, GameMapDefinition>([
  ["default", mapDefault],
  ["butterfly", butterflyMap],
  ["ironcross", ironCrossMap],
  ["mountains", mountainsMap]
]);

export type MapId = typeof MAPS extends Map<infer K, any> ? K : never;

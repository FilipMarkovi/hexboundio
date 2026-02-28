// shared/maps/index.ts
import { mapDefault } from "./instances/mapDefault";
import { butterflyMap } from "./instances/butterflyMap";
import { ironCrossMap } from "./instances/ironCrossMap";
import { mountainsMap } from "./instances/mountainsMap";
import { hugeMap } from "./instances/huge";
import { eightWayMap } from "./instances/eightWayMap";
import { GameMapDefinition } from "./types";
import { octagon } from "./instances/octagon";

export const MAPS = new Map<string, GameMapDefinition>([
  ["default", mapDefault],
  ["butterfly", butterflyMap],
  ["ironcross", ironCrossMap],
  ["mountains", mountainsMap],
  ["huge", hugeMap],
  ["eightway", eightWayMap],
  ["octagon", octagon]

]);

export type MapId = typeof MAPS extends Map<infer K, any> ? K : never;

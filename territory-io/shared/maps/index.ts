// shared/maps/index.ts
import { mapDefault } from "./mapDefault";
import { butterflyMap } from "./butterflyMap";
import { ironCrossMap } from "./ironCrossMap";

export const MAPS = {
  default: mapDefault,
  butterfly: butterflyMap,
  ironcross: ironCrossMap, 
};

export type MapId = keyof typeof MAPS;
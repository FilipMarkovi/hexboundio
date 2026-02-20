// shared/maps/types.ts
import type { TerrainType } from "./terrain";

export interface MapHex {
  q: number;
  r: number;
  terrain: TerrainType;
}

export interface HQSpawn {
  q: number;
  r: number;
}

export interface GameMapDefinition {
  id: string;
  name: string;
  hexes: MapHex[];
  hqSpawns: HQSpawn[];
}

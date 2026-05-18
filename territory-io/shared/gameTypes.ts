export type TerrainType =
  | "GRASS"
  | "MOUNTAIN"
  | "BEDROCK"
  | "DESERT"
  | "WATER";

export type GamePhase = "HQ_PLACEMENT" | "GAMEPLAY";

export type PlayerId = string

export type BuildingType = "FORT" | "BARRACKS" | "HOUSE";

export type PlayerStatus =
  | "LOBBY"     // connected, not queued
  | "QUEUED"    // clicked Play, waiting
  | "PLAYING"   // in active match
  | "ELIMINATED";

export interface Axial {
  q: number
  r: number
}

export interface TileState {
  q: number
  r: number
  ownerId: PlayerId | null
  defense: number

  building: "HQ" | BuildingType |  null
  
  terrain: TerrainType
  baseDefense: number

  defenseHeat: number
  lastDefendedAt: number

  capture: {
    by: PlayerId;
    progress: number;
    cost: number;
  } | null;
}

export interface PlayerState {
  id: PlayerId
  username: string | null
  color: string;
  status: PlayerStatus;
  gold: number
  army: number
  eliminated: boolean
  hqPos: Axial
  lastSeen: number
  isBot?: boolean

  buildings: {
    fort: number,
    barracks: number,
    house: number,
  }

}

export interface CoreGameState {
  phase: GamePhase;
  tiles: Map<string, TileState>;
  players: Map<PlayerId, PlayerState>;
  started: boolean;
  gameOver: null | { winner: PlayerId; };
  connectedCache?: Map<PlayerId, Set<string>> | null;
  mapId: null | string;
  mapName: null | string;
  HQLocations: Map<PlayerId, TileState>;
  placementTimeLeft?: number;
}
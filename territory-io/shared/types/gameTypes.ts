import { TerrainType } from "../maps/terrain.js";

export type PlayerId = string

export type BuildingType = "FORT" | "BARRACKS";

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
  building: "HQ" | "BARRACKS" | "FORT" | null

  terrain: TerrainType
  baseDefense: number

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

}


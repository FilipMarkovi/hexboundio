
import type { CoreGameState } from "../system/core/state.js";

export type WireState = {
  phase: any;
  tiles: any[];
  players: any[];
  started: boolean;
  gameOver: any;
  HQLocations: any;
  placementTimeLeft: any;
};

export function serializeState(state: CoreGameState): WireState {
  return {
    phase: state.phase,
    tiles: Array.from(state.tiles.values()),
    players: Array.from(state.players.values()),
    started: state.started,
    gameOver: state.gameOver,
    HQLocations: state.HQLocations,
    placementTimeLeft: state.placementTimeLeft,
  };
}

export function deserializeState(raw: WireState): CoreGameState {
  return {
    phase: raw.phase,
    tiles: new Map(raw.tiles.map((t: any) => [`${t.q},${t.r}`, t])),
    players: new Map(raw.players.map((p: any) => [p.id, p])),
    started: raw.started,
    gameOver: raw.gameOver,
    mapId: null,
    mapName: null,
    HQLocations: raw.HQLocations,
    placementTimeLeft: raw.placementTimeLeft
  };
}

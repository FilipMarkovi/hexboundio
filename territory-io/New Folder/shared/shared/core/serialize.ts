
import type { CoreGameState } from "./state";

export type WireState = {
  tiles: any[];
  players: any[];
  started: boolean;
  gameOver: any;
};

export function serializeState(state: CoreGameState): WireState {
  return {
    tiles: Array.from(state.tiles.values()),
    players: Array.from(state.players.values()),
    started: state.started,
    gameOver: state.gameOver
  };
}

export function deserializeState(raw: WireState): CoreGameState {
  return {
    tiles: new Map(raw.tiles.map((t: any) => [`${t.q},${t.r}`, t])),
    players: new Map(raw.players.map((p: any) => [p.id, p])),
    started: raw.started,
    gameOver: raw.gameOver
  };
}

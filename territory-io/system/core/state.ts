
import type { PlayerId, PlayerState, TileState } from "../../shared/index.js";
import { getConnectedTilesFromHQ } from "./systems.js";
export interface CoreGameState {
  tiles: Map<string, TileState>;
  players: Map<PlayerId, PlayerState>;
  started: boolean;
  gameOver: null | { winner: PlayerId; };
  connectedCache?: Map<PlayerId, Set<string>> | null;
  mapId: null | string;
  mapName: null | string;
} // copy in shared

export function createGameState(): CoreGameState {
  return {
    tiles: new Map(),
    players: new Map(),
    started: false,
    gameOver: null,
    connectedCache: null,
    mapId: null,
    mapName: null,
  };
}

export function key(q: number, r: number) {
  return `${q},${r}`;
}

export function getTile(state: CoreGameState, q: number, r: number) {
  return state.tiles.get(key(q, r));
}

export function setPlayer(state: CoreGameState, player: PlayerState) {
  state.players.set(player.id, player);
}

// Hex axial neighbors (pointy-top axial)
export const DIRS: Array<{ q: number; r: number }> = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
];

export function neighbors(q: number, r: number) {
  return DIRS.map(d => ({ q: q + d.q, r: r + d.r }));
}

export function isAdjacentOwned(state: CoreGameState, q: number, r: number, ownerId: PlayerId): boolean {
  return neighbors(q, r).some(n => {
    const t = getTile(state, n.q, n.r);
    return !!t && t.ownerId === ownerId;
  });
}

export function neighborTiles(state: CoreGameState, q: number, r: number): any {
  let found = Array()
  neighbors(q, r).forEach(n => {
    const t = getTile(state, n.q, n.r);
    found.push(t)
  });
  return found;
}

export function nonOwnedNeighbors(state: CoreGameState, q: number, r: number, ownerId: PlayerId): any {
  let found = Array()
  neighbors(q, r).some(n => {
    const t = getTile(state, n.q, n.r);
    if (t && t.ownerId != ownerId)
    found.push(n)
  });
  return found;
}

export function isAdjacentOwnedAndConnected(
  state: CoreGameState,
  q: number,
  r: number,
  playerId: PlayerId
): boolean {
  const connected = getConnectedTilesFromHQ(state, playerId);

  return neighbors(q, r).some(n => {
    const t = getTile(state, n.q, n.r);
    if (!t) return false;
    if (t.ownerId !== playerId) return false;
    return connected.has(key(t.q, t.r));
  });
}

export function hexDistance(
  a: { q: number; r: number },
  b: { q: number; r: number }
): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = (a.q + a.r) - (b.q + b.r);

  return (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
}

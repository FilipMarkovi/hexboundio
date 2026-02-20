
import type { PlayerId, TileState } from "../types/gameTypes";
import { BASE_CAPTURE_COST, BASE_TILE_DEFENSE, FORT_COST, FORT_DEFENSE_ADJACENT, FORT_DEFENSE_SELF,
   HQ_DEFENSE_ADJACENT, HQ_DEFENSE_SELF, GOLD_PER_TILE, BASE_ARMY_MAX, BASE_GOLD_MAX, ARMY_CAP_PER_TILE, CAPTURE_RATE,
    GOLD_PASSIVE, ARMY_PASSIVE, BARRACKS_COST, BARRACKS_ARMY_BONUS, DEFEND_COST_RATIO, BUILDING_COST, DEMOLISH_REFUND_RATIO, PLAYER_COLORS} from "./constants";
import type { CoreGameState } from "./state";
import { getTile, isAdjacentOwned, key, neighbors, isAdjacentOwnedAndConnected } from "./state";


export type Intent =
  | { type: "CAPTURE"; q: number; r: number }
  | { type: "BUILD_FORT"; q: number; r: number }
  | { type: "BUILD_BARRACKS"; q: number; r: number }
  | { type: "DEMOLISH"; q: number; r: number }
  | { type: "DEFEND"; q: number; r: number }
  | { type: "JOIN_QUEUE"; username: string }
  | { type: "PING" };

export function captureCost(defense: number) {
  return BASE_CAPTURE_COST * defense;
}

function applyAdjacencyBonus(
  state: CoreGameState,
  tile: TileState,
  selfBonus: number,
  adjacentBonus: number
) {
  tile.defense += selfBonus;

  for (const n of neighbors(tile.q, tile.r)) {
    const t = getTile(state, n.q, n.r);
    if (t && t.ownerId === tile.ownerId) {
      t.defense += adjacentBonus;
    }
  }
}

export function recalcDefense(state: CoreGameState) {
  // PASS 1: reset to immutable base
  for (const tile of state.tiles.values()) {
    tile.defense = tile.baseDefense;
  }

  // PASS 2: apply owned-tile modifiers
  for (const tile of state.tiles.values()) {
    const owner = tile.ownerId;
    if (!owner) continue;

    if (tile.building === "FORT") {
      applyAdjacencyBonus(
        state,
        tile,
        FORT_DEFENSE_SELF,
        FORT_DEFENSE_ADJACENT
      );
    }

    if (tile.building === "HQ") {
      applyAdjacencyBonus(
        state,
        tile,
        HQ_DEFENSE_SELF,
        HQ_DEFENSE_ADJACENT
      );
    }

  }
}

export function placeHQ(state: CoreGameState, q: number, r: number, playerId: PlayerId) {
  const tile = getTile(state, q, r);
  if (!tile) throw new Error("Cannot place HQ on invalid tile");
  tile.ownerId = playerId;
  tile.building = "HQ";
  recalcDefense(state);
}

export function canStartCapture(state: CoreGameState, playerId: PlayerId, q: number, r: number) {
  const tile = getTile(state, q, r);
  const player = state.players.get(playerId);
  if (!tile || !player) return false;
  if (tile.ownerId === playerId) return false;
  if (!isAdjacentOwnedAndConnected(state, q, r, playerId)) return false;
  if (tile.terrain === "BEDROCK") return false;
  const cost = captureCost(tile.defense);
  return player.army >= cost;
}

export function canContinueCapture(state: CoreGameState, playerId: PlayerId, q: number, r: number) {
  const tile = getTile(state, q, r);
  const player = state.players.get(playerId);
  if (!tile || !player) return false;
  if (tile.ownerId === playerId) return false;
  // still must keep adjacency + supply while capturing
  if (!isAdjacentOwnedAndConnected(state, q, r, playerId)) return false;
  if (tile.terrain === "BEDROCK") return false;
  return true;
}

export function tryCapture(
  state: CoreGameState,
  playerId: PlayerId,
  q: number,
  r: number
) {
  const tile = getTile(state, q, r);
  const player = state.players.get(playerId);
  if (!tile || !player) return false; //

  if (tile.ownerId === playerId) return false; // 
  if (!isAdjacentOwnedAndConnected(state, q, r, playerId)) return false; // 
  if (tile.terrain === "BEDROCK") return false;

  // Already being captured by same player → ignore . what if another player
  if (tile.capture && tile.capture.by !== playerId) {
    return false;
  }

  if (tile.capture && tile.capture.by === playerId) return true;

  const cost = captureCost(tile.defense);
  if (player.army < cost) return false;

  // Pay upfront (important for commitment)
  player.army -= cost;

  // Start capture
  tile.capture = {
    by: playerId,
    progress: 0,
    cost
  };

  return true;
}

export function tryDefend(state: CoreGameState, playerId: PlayerId, q: number, r: number) {
  const tile = getTile(state, q, r);
  const player = state.players.get(playerId);
  if (!tile || !player) return false;

  if (!tile.capture) return false;                 
  if (tile.ownerId !== playerId) return false;    
  if (!isTileConnectedToHQ(state, playerId, q, r)) return false;

  const cost = Math.ceil(tile.capture.cost * DEFEND_COST_RATIO) ;
  if (player.army < cost) return false;

  player.army -= cost;
  tile.capture = null; // cancel capture
  return true;
}

export function tryBuildFort(state: CoreGameState, playerId: PlayerId, q: number, r: number) {
  const tile = getTile(state, q, r);
  const player = state.players.get(playerId);
  if (!tile || !player) return false;
  if (tile.ownerId !== playerId) return false;
  if (tile.building !== null) return false;
  if (player.gold < FORT_COST) return false;
  if (!isTileConnectedToHQ(state, playerId, q, r)) return false;

  player.gold -= FORT_COST;
  tile.building = "FORT";
  recalcDefense(state);
  return true;
}

export function tryBuildBarracks(
  state: CoreGameState,
  playerId: PlayerId,
  q: number,
  r: number
) {
  const tile = getTile(state, q, r);
  const player = state.players.get(playerId);
  if (!tile || !player) return false;
  if (tile.ownerId !== playerId) return false;
  if (tile.building !== null) return false;
  if (player.gold < BARRACKS_COST) return false;
  if (!isTileConnectedToHQ(state, playerId, q, r)) return false;

  player.gold -= BARRACKS_COST;
  tile.building = "BARRACKS";

  return true;
}

export function tick(state: CoreGameState, dt: number) {
  dt = Math.min(dt, 0.25);

  state.connectedCache = new Map();
  for (const p of state.players.values()) {
    if (!p.eliminated && p.status === "PLAYING") {
      state.connectedCache.set(
        p.id,
        computeConnectedTilesFromHQ(state, p.id)
      );
    }
  }

  // Count connected tiles + barracks
  const ownedCount = new Map<PlayerId, number>();
  const barracksCount = new Map<PlayerId, number>();

  for (const t of state.tiles.values()) {

    if (t.capture) {
      const { by } = t.capture;

      // If capture conditions no longer valid → cancel
      if (!canContinueCapture(state, by, t.q, t.r)) {
        t.capture = null;
        continue;
      }

      t.capture.progress +=
        (CAPTURE_RATE / t.defense) * dt;

      if (t.capture.progress >= 1) {
        // === FINISH CAPTURE ===
        const prevOwner = t.ownerId;
        const prevBuilding = t.building;
        const wasHQ = t.building === "HQ";

        t.ownerId = by;

        // Clear buildings except barracks rule (your existing logic)
        if (prevBuilding === "BARRACKS") {
          t.building = "BARRACKS";
        } else {
          t.building = null;
        }

        t.capture = null;

        recalcDefense(state);

        if (wasHQ && prevOwner && prevOwner !== by) {
          handlePlayerDeath(state, prevOwner);
        }
      }
    }
    if (!t.ownerId) continue;

    const set = state.connectedCache.get(t.ownerId);
    if (!set) continue;

    if (!set.has(key(t.q, t.r))) continue; // CUT OFF

    ownedCount.set(t.ownerId, (ownedCount.get(t.ownerId) ?? 0) + 1);

    if (t.building === "BARRACKS") {
      barracksCount.set(
        t.ownerId,
        (barracksCount.get(t.ownerId) ?? 0) + 1
      );
    }
  }

  // Apply income / regen
  for (const p of state.players.values()) {
    if (p.eliminated) continue;
    if (p.status !== "PLAYING") continue;

    const owned = ownedCount.get(p.id) ?? 0;
    const barracks = barracksCount.get(p.id) ?? 0;

    const effectiveOwned = Math.max(0, owned - 1);
    const armyCap = BASE_ARMY_MAX + effectiveOwned * ARMY_CAP_PER_TILE;

    p.gold = Math.min(
      BASE_GOLD_MAX,
      p.gold + (owned * GOLD_PER_TILE + GOLD_PASSIVE) * dt
    );

    p.army = Math.min(
      armyCap,
      p.army + (ARMY_PASSIVE + barracks * BARRACKS_ARMY_BONUS) * dt
    );
  }
}

export function applyIntent(state: CoreGameState, playerId: PlayerId, intent: Intent) {
  if (!state.started || state.gameOver) return;
  if (intent.type === "CAPTURE") tryCapture(state, playerId, intent.q, intent.r);
  if (intent.type === "BUILD_FORT") tryBuildFort(state, playerId, intent.q, intent.r);
  if (intent.type === "BUILD_BARRACKS") tryBuildBarracks(state, playerId, intent.q, intent.r);
  if (intent.type === "DEMOLISH") handleDemolish(state, playerId, intent.q, intent.r);
  if (intent.type === "DEFEND") tryDefend(state, playerId, intent.q, intent.r);
  
}

export function handlePlayerDeath(
  state: CoreGameState,
  deadPlayerId: PlayerId
) {
  // 1. Remove all tiles owned by the player
  for (const tile of state.tiles.values()) {
    if (tile.ownerId === deadPlayerId) {
      tile.ownerId = null;
      tile.building = null;
      tile.defense = 1; // base defense (will be recalculated anyway)
    }
  }

  // 2. Remove player from player list
  const player = state.players.get(deadPlayerId);
  if (player) {
    player.eliminated = true;
  }
  

  // 3. Recalculate defenses (important!)
  recalcDefense(state);

  // check if there is only one player left alive
  checkGameOver(state)
}

export function checkGameOver(state: CoreGameState) {
  let aliveCount = 0;
  let lastAliveUsername: string | null = null;

  for (const p of state.players.values()) {
    if (p.status === "PLAYING" && !p.eliminated) {
      aliveCount += 1;
      lastAliveUsername = p.username;
    }
  }

  if (aliveCount <= 1 && lastAliveUsername) {
    state.gameOver = { winner: lastAliveUsername };
  }
}

export function computeConnectedTilesFromHQ(
  state: CoreGameState,
  playerId: PlayerId
): Set<string> {
  const visited = new Set<string>();
  const stack: Array<{ q: number; r: number }> = [];

  // Find HQ
  let hqTile: { q: number; r: number } | null = null;

  for (const t of state.tiles.values()) {
    if (t.ownerId === playerId && t.building === "HQ") {
      hqTile = { q: t.q, r: t.r };
      break;
    }
  }

  if (!hqTile) return visited;

  stack.push(hqTile);
  visited.add(key(hqTile.q, hqTile.r));

  while (stack.length > 0) {
    const cur = stack.pop()!;

    for (const n of neighbors(cur.q, cur.r)) {
      const t = getTile(state, n.q, n.r);
      if (!t) continue;
      if (t.ownerId !== playerId) continue;

      const k = key(t.q, t.r);
      if (visited.has(k)) continue;

      visited.add(k);
      stack.push({ q: t.q, r: t.r });
    }
  }

  return visited;
}

export function getConnectedTilesFromHQ(
  state: CoreGameState,
  playerId: PlayerId
): Set<string> {
  return state.connectedCache?.get(playerId) ?? new Set();
}

export function isTileConnectedToHQ(
  state: CoreGameState,
  playerId: PlayerId,
  q: number,
  r: number
): boolean {
  const connected = getConnectedTilesFromHQ(state, playerId);
  return connected.has(key(q, r));
}

export function handleDemolish(
  state: CoreGameState,
  playerId: PlayerId,
  q: number,
  r: number
) {
  const tile = getTile(state, q, r);
  if (!tile) return;
  if (tile.ownerId !== playerId) return;
  if (!tile.building) return;
  if (tile.building === "HQ") return;

  if (!isTileConnectedToHQ(state, playerId, q, r)) return;

  const cost = BUILDING_COST[tile.building];
  const refund = Math.floor(cost * DEMOLISH_REFUND_RATIO);

  tile.building = null;
  state.players.get(playerId)!.gold += refund;

  recalcDefense(state);
}


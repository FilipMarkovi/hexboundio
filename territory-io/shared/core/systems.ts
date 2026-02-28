
import { isNumberObject } from "node:util/types";
import type { PlayerId, TileState, BuildingType } from "../types/gameTypes";
import { BASE_CAPTURE_COST, FORT_DEFENSE_ADJACENT, FORT_DEFENSE_SELF,
   HQ_DEFENSE_ADJACENT, HQ_DEFENSE_SELF, GOLD_PER_TILE, BASE_ARMY_MAX, BASE_GOLD_MAX, ARMY_CAP_PER_TILE, CAPTURE_RATE,
    GOLD_PASSIVE, ARMY_PASSIVE, BARRACKS_ARMY_BONUS, DEFEND_COST_RATIO, BUILDING_COST,
     DEMOLISH_REFUND_RATIO, GOLD_PEAK, ARMY_PEAK,  DEFENSE_HEAT_MAX, DEFENSE_HEAT_DECAY_MS,
    DEFENSE_COST_INCREMENT, TILE_ATTACK_COOLDOWN, BUILDING_LIMIT, HOUSE_ARMY_CAP_BONUS, ARMY_PER_TILE,
  TILES_UNTIL_MAX_ATTACKTIME_INCREASE, MAX_ATTACKTIME_INCREASE, NEUTRAL_TILE_CAPTURE_GOLD,
  PLAYER_KILL_GOLD_REWARD} from "./constants";
import type { CoreGameState } from "./state";
import { getTile, isAdjacentOwned, key, neighbors, isAdjacentOwnedAndConnected } from "./state";


export type Intent =
  | { type: "CAPTURE"; q: number; r: number }
  | { type: "BUILD"; q: number; r: number; buildingType: string }
  | { type: "DEMOLISH"; q: number; r: number }
  | { type: "DEFEND"; q: number; r: number }
  | { type: "JOIN_QUEUE"; username: string }
  | { type: "RETURN_LOBBY" }
  | { type: "PING" }
  | null;

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
  if(Date.now() - tile.lastDefendedAt < TILE_ATTACK_COOLDOWN) return false
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
  
  const heatCostIncrease = tile.defenseHeat * DEFENSE_COST_INCREMENT

  const cost = Math.ceil(tile.capture.cost * (DEFEND_COST_RATIO + heatCostIncrease)) ;
  if (player.army < cost) return false;

  player.army -= cost;
  tile.capture = null; // cancel capture

  tile.defenseHeat = Math.min(tile.defenseHeat + 1, DEFENSE_HEAT_MAX); 
  tile.lastDefendedAt = Date.now();
  return true;
}

export function tryBuild(
  state: CoreGameState,
  playerId: PlayerId,
  q: number,
  r: number,
  buildingType: BuildingType,
) {
  const tile = getTile(state, q, r);
  const player = state.players.get(playerId);
  if (!tile || !player) return false;
  if (tile.ownerId !== playerId) return false;
  if (tile.building !== null) return false;
  if (player.gold < BUILDING_COST[buildingType]) return false;
  if (!isTileConnectedToHQ(state, playerId, q, r)) return false;
  if(player.buildings.barracks >= BUILDING_LIMIT[buildingType]) return false

  player.gold -= BUILDING_COST[buildingType];
  const bKey = buildingType.toLowerCase() as keyof typeof player.buildings;
  player.buildings[bKey]++;
  tile.building = buildingType;
  if(buildingType == "FORT")
    recalcDefense(state)

  return true;
}

export function tick(state: CoreGameState, dt: number) {
  dt = Math.min(dt, 0.25);
  const now = Date.now()

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
      
      // capture progress (big territory = slower capture)
      const territorySize: number = state.connectedCache.get(t.ownerId!)?.size ?? 0;
      t.capture.progress +=
        (CAPTURE_RATE / Math.max(1,t.defense) / 
        (Math.min(MAX_ATTACKTIME_INCREASE, territorySize / TILES_UNTIL_MAX_ATTACKTIME_INCREASE) + 1)) * dt;

      if (t.capture.progress >= 1) {
        // === FINISH CAPTURE ===
        const prevOwner = t.ownerId;
        const prevBuilding = t.building;
        const wasHQ = t.building === "HQ";
        const attackingPlayer = state.players.get(by!)
        // building clearing / owning
        if(prevBuilding && attackingPlayer){
          const defendingPlayer = state.players.get(String(t.ownerId))
          if(attackingPlayer && defendingPlayer){
            if (prevBuilding === "BARRACKS") {
              defendingPlayer.buildings.barracks--;
              if(attackingPlayer.buildings.barracks < BUILDING_LIMIT["BARRACKS"]){
                t.building = "BARRACKS";
                attackingPlayer.buildings.barracks++;
              } else
                t.building = null;
            } else if (prevBuilding === "HOUSE") {
              defendingPlayer.buildings.house--;
              if(attackingPlayer.buildings.house < BUILDING_LIMIT["HOUSE"]){
                t.building = "HOUSE";
                attackingPlayer.buildings.house++;
              } else
                t.building = null;
            } else if(prevBuilding === "FORT") {
              t.building = null;
              defendingPlayer.buildings.fort--;
            } else if(prevBuilding === "HQ") {
              t.building = null;
            } else {
              t.building = null;
            }
          }
        }
        t.ownerId = by;
        t.defenseHeat = 0;
        t.lastDefendedAt = 0;
        if(attackingPlayer)
          attackingPlayer.gold = Math.min(BASE_GOLD_MAX, attackingPlayer.gold + NEUTRAL_TILE_CAPTURE_GOLD * t.baseDefense)


        t.capture = null;

        recalcDefense(state);

        if (wasHQ && prevOwner && prevOwner !== by) {
          handlePlayerDeath(state, prevOwner);
          if(attackingPlayer)
            attackingPlayer.gold = Math.min(BASE_GOLD_MAX, attackingPlayer.gold + PLAYER_KILL_GOLD_REWARD)
        }
      }
      
    }
    if (!t.ownerId) continue;

    // reset heat for necessary tiles with owner
    if (now - t.lastDefendedAt > DEFENSE_HEAT_DECAY_MS) {
      t.defenseHeat = 0;
    }

    const set = state.connectedCache.get(t.ownerId);
    if (!set) continue;

    if (!set.has(key(t.q, t.r))) continue; // CUT OFF

    ownedCount.set(t.ownerId, (ownedCount.get(t.ownerId) ?? 0) + 1);
  }

  // Apply income / regen
  for (const p of state.players.values()) {
    if (p.eliminated) continue;
    if (p.status !== "PLAYING") continue;

    const owned = ownedCount.get(p.id) ?? 0;
    const barracks = p.buildings.barracks ?? 0
    const effectiveOwned = Math.max(0, owned - 1);
    const armyCap = BASE_ARMY_MAX + effectiveOwned * ARMY_CAP_PER_TILE + (p.buildings.house ?? 0) * HOUSE_ARMY_CAP_BONUS;

    // gold optimum around GOLD_PEAK ratio, army optimum around ARMY_PEAK ratio
    // initial falloff is gradual, then steep toward extremes
    const ratio = armyCap > 0 ? p.army / armyCap : 0;
    const armyMult = Math.max(0.4, 1 - 2.2 * Math.pow(ratio - ARMY_PEAK, 2)); // 2.2 is slope decline rate, higher number faster falloff from optimum
    const goldMult = Math.max(0.4, 1 - 1.95 * Math.pow(ratio - GOLD_PEAK, 2)); // exponent is width of bell

    p.gold = Math.min(
      BASE_GOLD_MAX,
      p.gold + (owned * GOLD_PER_TILE + GOLD_PASSIVE) * dt * goldMult
    );

    p.army = Math.min(
      armyCap,
      p.army + (ARMY_PASSIVE + barracks * BARRACKS_ARMY_BONUS + owned * ARMY_PER_TILE) * dt * armyMult
    );
  }
}

export function applyIntent(state: CoreGameState, playerId: PlayerId, intent: Intent) {
  if (!state.started || state.gameOver || !intent) return;
  if (intent.type === "CAPTURE") tryCapture(state, playerId, intent.q, intent.r);
  if (intent.type === "BUILD") tryBuild(state, playerId, intent.q, intent.r, intent.buildingType as BuildingType);
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

  // check if there is only one player left alive or if only bots remain
  checkGameOver(state)
}

export function checkGameOver(state: CoreGameState) {
  let aliveCount = 0;
  let lastAliveUsername: string | null = null;
  let realPlayerCount = 0;
  for (const p of state.players.values()) {
    if (p.status === "PLAYING" && !p.eliminated) {
      aliveCount += 1;
      lastAliveUsername = p.username;
      if(!p.isBot) realPlayerCount++;
    }
  }

  if ((aliveCount <= 1 && lastAliveUsername)) {
    state.gameOver = { winner: lastAliveUsername };
  }
  if (realPlayerCount <= 0) {
    if (lastAliveUsername)
      state.gameOver = { winner: lastAliveUsername };
    else
      state.gameOver = { winner: "BOTS" }
  }
}

export function computeConnectedTilesFromHQ(
  state: CoreGameState,
  playerId: PlayerId
): Set<string> {
  if(!playerId) return new Set()
  const visited = new Set<string>();
  const stack: Array<{ q: number; r: number }> = [];

  // Find HQ
  let hqTile: { q: number; r: number } | null = null;
  const player = state.players.get(playerId);
  if (player) {
    hqTile = player.hqPos;
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
      stack.push({ q: t.q, r: t.r });if(!playerId) return new Set()
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
  const player = state.players.get(playerId)
  if(!player) return;

  if (!isTileConnectedToHQ(state, playerId, q, r)) return;

  const cost = BUILDING_COST[tile.building];
  const refund = Math.floor(cost * DEMOLISH_REFUND_RATIO);

  const key = tile.building.toLowerCase() as keyof typeof player.buildings;
  player.buildings[key]--;
  tile.building = null;
  player.gold += refund;

  recalcDefense(state);
}


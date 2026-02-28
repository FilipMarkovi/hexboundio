// server/ai/simpleExpandBot.ts

import { get } from "node:http";
import { CoreGameState, PlayerId, nonOwnedNeighbors, getConnectedTilesFromHQ, neighborTiles, getTile,
   BUILDING_COST, BUILDING_LIMIT, hexDistance, TileState, PIVOT_DIST, STEEPNESS, key, Intent, canStartCapture,} from "../../../shared";
import { shuffle } from "../init/spawnPlayersFromMap.js";

export function dumbAI(
  state: CoreGameState,
  botId: PlayerId
): Intent {
  const bot = state.players.get(botId);
  if (!bot || bot.eliminated || bot.status !== "PLAYING") return null;

  // Collect owned tiles
  const ownedTiles = [...getConnectedTilesFromHQ(state, botId)];

  if (ownedTiles.length === 0) return null;
  shuffle(ownedTiles);

  for (const tileAxial of ownedTiles){
    const ownedTile = state.tiles.get(tileAxial);
    if (!ownedTile) continue;
    let validTargets = nonOwnedNeighbors(state, ownedTile.q, ownedTile.r, botId);
    if (validTargets.length == 0) continue;

    const target =
        validTargets[Math.floor(Math.random() * validTargets.length)];
    return {
        type: "CAPTURE",
        q: target.q,
        r: target.r,
    };
  }

  return null;
}


export function normalAI(state: CoreGameState, botId: PlayerId): Intent {
  const bot = state.players.get(botId);
  if (!bot || bot.eliminated || bot.status !== "PLAYING") return null;

  const hq = bot.hqPos;

  // Secure HQ
  const hqNeighbors = neighborTiles(state, hq.q, hq.r);
  shuffle(hqNeighbors)
  for (const tile of hqNeighbors) {
    if (tile && tile.ownerId !== botId) {
      return { type: "CAPTURE", q: tile.q, r: tile.r };
    }
  }

  // Build defense
  if (bot.gold >= BUILDING_COST["FORT"])
    for (const tile of hqNeighbors) {
      if (tile && !tile.building && tile.ownerId === botId) {
          console.log("build")
          return { type: "BUILD", q: tile.q, r: tile.r, buildingType:"FORT" };
      }
    }

  // Smart expansion

  const ownedTiles = [...getConnectedTilesFromHQ(state, botId)];

  if (ownedTiles.length === 0) return null;
  shuffle(ownedTiles);

  for (const tileAxial of ownedTiles){
    const ownedTile = state.tiles.get(tileAxial);
    if(!ownedTile) continue;
    let validTargets = nonOwnedNeighbors(state, ownedTile.q, ownedTile.r, botId);
    if (validTargets.length == 0) continue;

    const target =
        validTargets[Math.floor(Math.random() * validTargets.length)];
    return {
        type: "CAPTURE",
        q: target.q,
        r: target.r,
    };
  }

  return null;
}

export function hardAI(
  state: CoreGameState,
  botId: PlayerId
): Intent {
  const bot = state.players.get(botId);
  if (!bot || bot.eliminated || bot.status !== "PLAYING") return null;

  const hq = bot.hqPos;

  // CAPTURE RING AROUND HQ

  const hqNeighbors = neighborTiles(state, hq.q, hq.r);
  shuffle(hqNeighbors);

  for (const tile of hqNeighbors) {
    if (!tile) continue;

    if (tile.ownerId !== botId) {
      return { type: "CAPTURE", q: tile.q, r: tile.r };
    }
  }

  // BUILD FORTS ON HQ RING

  if (bot.gold >= BUILDING_COST["FORT"] && bot.buildings.fort < BUILDING_LIMIT["FORT"]) {
    for (const tile of hqNeighbors) {
      if (
        tile &&
        tile.ownerId === botId &&
        !tile.building
      ) {
        return {
          type: "BUILD",
          q: tile.q,
          r: tile.r,
          buildingType: "FORT"
        };
      }
    }
  }

  // EXPAND TOWARD HQ RADIUS 
  const ownedTiles = [...getConnectedTilesFromHQ(state, botId)];
  if (ownedTiles.length === 0) return null;

  const uniqueTargets = new Map<string, { target: TileState; weight: number }>();

  for (const axial of ownedTiles) {
    const tile = state.tiles.get(axial);
    if (!tile) continue;

    const neighbors = nonOwnedNeighbors(state, tile.q, tile.r, botId);

    for (const n of neighbors) {
      const target = getTile(state, n.q, n.r);
      if (!target || target.capture) continue;

      const targetKey = key(target.q, target.r);
      
      // Skip if already calculated this tile from a different neighbor
      if (uniqueTargets.has(targetKey)) continue;

      const dist = hexDistance(
        { q: hq.q, r: hq.r },
        { q: target.q, r: target.r }
      );

      // fitness score -> higher score more likely to be choosen
      const distanceScore = Math.pow(STEEPNESS, PIVOT_DIST - dist);
      const defenseWeight = Math.min(1.0, dist / PIVOT_DIST);
      const defenseScore = Math.max(0.1, 12 - (target.defense * defenseWeight));
      const finalScore = distanceScore * defenseScore;


      uniqueTargets.set(targetKey, { 
        target, 
        weight: finalScore
      });
    }
  }

  const candidates = Array.from(uniqueTargets.values());


  // PROBABILISTIC SELECTION
  if (candidates.length > 0) {
    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    let randomRoll = Math.random() * totalWeight;

    for (const candidate of candidates) {
      randomRoll -= candidate.weight;
      if (randomRoll <= 0) {
        if(canStartCapture(state,botId,candidate.target.q,candidate.target.r))
          return {
            type: "CAPTURE",
            q: candidate.target.q,
            r: candidate.target.r
          };
      }
    }
  }

  return null;
}
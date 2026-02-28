import { CoreGameState, PlayerId, MAPS } from "../../../shared";
import crypto from "node:crypto";
import { createGameState } from "../../../shared";
import { butterflyMap } from "../../../shared/maps/instances/butterflyMap.js";
import { mountainsMap } from "../../../shared/maps/instances/mountainsMap";
import { eightWayMap } from "../../../shared/maps/instances/eightWayMap";

export type RoomId = string;

export type GameRoom = {
  id: RoomId;
  state: CoreGameState;
  playerIds: Set<PlayerId>;  
  lastTickMs: number;
  closing: boolean;           // to avoid double-destroy
  mapId: string;
  maxPlayers: number;
};

type WeightedMap = {
  id: string;
  weight: number;
};

// default: every map has weight = 1
const MAP_POOL: WeightedMap[] =
  Array.from(MAPS.keys()).map((id): WeightedMap => ({
    id: id as string,
    weight: 0,
  }));


// override weights
const EXTRA_WEIGHTS: Record<string, number> = {
  octagon: 1,
};

for (const m of MAP_POOL) {
  if (EXTRA_WEIGHTS[m.id] !== undefined) {
    m.weight = EXTRA_WEIGHTS[m.id];
  }
}

let lastMapId: string | null = null;

function pickWeightedMapId(): string {
  if (MAP_POOL.length === 0) {
    throw new Error("MAP_POOL is empty");
  }

  const totalWeight = MAP_POOL.reduce((sum, m) => sum + m.weight, 0);
  let r = Math.random() * totalWeight;

  for (const m of MAP_POOL) {
    if (r < m.weight) {
      // prevent same map twice in a row
      /*
      if (m.id === lastMapId && MAP_POOL.length > 1) {
        return pickWeightedMapId();
      }
        */

      lastMapId = m.id;
      return m.id;
    }
    r -= m.weight;
  }

  return MAP_POOL[0].id;
}


export function createRoom(rooms: Map<RoomId, GameRoom>): GameRoom {
  const id = crypto.randomUUID();

  const mapId = pickWeightedMapId();
  const map = MAPS.get(mapId);

  if (!map) {
    throw new Error(`Map not found: ${mapId}`);
  }

  const room: GameRoom = {
    id,
    state: createGameState(),
    playerIds: new Set(),
    lastTickMs: Date.now(),
    closing: false,
    mapId,
    maxPlayers: Array.from(map.hqSpawns).length,
  };

  rooms.set(id, room);
  return room;
}

import type { CoreGameState, PlayerId, BuildingType } from "./gameTypes"; 

function createZeroedBuildingCounts() {
  return {
    barracks: 0,
    fort: 0,
    house: 0,
    laboratory: 0,
    siege_outpost: 0,
  };
}

const pendingQueueMap = new Map<PlayerId, ReturnType<typeof createZeroedBuildingCounts>>();

function getOrCreatePendingData(playerId: PlayerId) {
  let data = pendingQueueMap.get(playerId);
  if (!data) {
    data = createZeroedBuildingCounts();
    pendingQueueMap.set(playerId, data);
  }
  return data;
}

export function getActiveCount(state: CoreGameState, playerId: PlayerId, type: BuildingType): number {
  const player = state.players.get(playerId);
  if (!player) return 0;
  const bKey = type.toLowerCase() as keyof typeof player.buildings;
  return player.buildings[bKey] || 0;
}

export function getPendingCount(playerId: PlayerId, type: BuildingType): number {
  const data = getOrCreatePendingData(playerId);
  const bKey = type.toLowerCase() as keyof typeof data;
  return data[bKey];
}

export function getTotalPlannedCount(state: CoreGameState, playerId: PlayerId, type: BuildingType): number {
  return getActiveCount(state, playerId, type) + getPendingCount(playerId, type);
}

export function incrementPending(playerId: PlayerId, type: BuildingType): void {
  const data = getOrCreatePendingData(playerId);
  const bKey = type.toLowerCase() as keyof typeof data;
  data[bKey]++;
}

export function decrementPending(playerId: PlayerId, type: BuildingType): void {
  const data = getOrCreatePendingData(playerId);
  const bKey = type.toLowerCase() as keyof typeof data;
  data[bKey] = Math.max(0, data[bKey] - 1); 
}

export function clearPendingTracker(playerId: PlayerId): void {
  pendingQueueMap.delete(playerId);
}
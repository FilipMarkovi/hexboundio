import type { BuildingType } from "../../../shared";
import { BUILDING_COST, BUILDING_LIMIT } from "../constants";
import { clientUIState } from "../state/clientState";
import { clientNetState } from "../state/clientState";

function getCost(type: BuildingType): number {
  return BUILDING_COST[type]
}

function getLimit(type: BuildingType): number {
  return BUILDING_LIMIT[type]
}

export function toggleBuildMode(type: BuildingType) {
  const state = clientNetState.state;
  const me = clientNetState.playerId;
  if (!state || !me) return;

  const player = state.players.get(me);
  if (!player) return;

  const cost = getCost(type);
  const countkey = type.toString().toLowerCase() as keyof typeof player.buildings;

  // not enough gold or limit reached skip
  if (player.gold < cost || (player.buildings[countkey] >= getLimit(type))) return;

  // Toggle behavior
  if (clientUIState.selectedBuilding === type) {
    clientUIState.selectedBuilding = null;
  } else {
    clientUIState.selectedBuilding = type;
  }
}


export function clearBuildMode() {
  clientUIState.selectedBuilding = null;
}

import type { BuildingType } from "../../../shared";
import { FORT_COST, BARRACKS_COST } from "../../../shared";
import { clientUIState } from "../state/clientState";
import { clientNetState } from "../state/clientState";

function getCost(type: BuildingType): number {
  switch (type) {
    case "FORT": return FORT_COST;
    case "BARRACKS": return BARRACKS_COST;
  }
}

export function toggleBuildMode(type: BuildingType) {
  const state = clientNetState.state;
  const me = clientNetState.playerId;
  if (!state || !me) return;

  const player = state.players.get(me);
  if (!player) return;

  const cost = getCost(type);

  // not enough gold skip
  if (player.gold < cost) return;

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

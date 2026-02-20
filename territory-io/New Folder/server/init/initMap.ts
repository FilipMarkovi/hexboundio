import type { CoreGameState } from "../../../shared/index";
import type { GameMapDefinition } from "../../../shared/maps/types";
import { TERRAIN_BASE_DEFENSE } from "../../../shared/core/constants";

export function initMap(
  state: CoreGameState,
  map: GameMapDefinition
) {

  state.tiles.clear();

  for (const hex of map.hexes) {
    state.tiles.set(`${hex.q},${hex.r}`, {
      q: hex.q,
      r: hex.r,
      ownerId: null,
      building: null,
      terrain: hex.terrain,
      baseDefense: TERRAIN_BASE_DEFENSE[hex.terrain],
      defense: TERRAIN_BASE_DEFENSE[hex.terrain],
    });
  }

  state.mapId = map.id;
  state.mapName = map.name;
}

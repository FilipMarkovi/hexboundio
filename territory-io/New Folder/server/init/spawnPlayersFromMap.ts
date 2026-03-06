import { CoreGameState, placeHQ } from "../../../system";
import type { GameMapDefinition } from "../../../system/maps/types";


function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function spawnPlayersFromMap(
  state: CoreGameState,
  map: GameMapDefinition
) {
  const playerIds = Array.from(state.players.keys());
  const spawns = [...map.hqSpawns]; // copy for safety

  if (playerIds.length > spawns.length) {
    throw new Error(
      `Too many players (${playerIds.length}) for map '${map.id}' (max ${spawns.length})`
    );
  }

  // Optional: deterministic but fair shuffle
  // comment this out if you want fixed order
  shuffle(spawns);

  for (let i = 0; i < playerIds.length; i++) {
    const { q, r } = spawns[i];
    placeHQ(state, q, r, playerIds[i]);
  }
}

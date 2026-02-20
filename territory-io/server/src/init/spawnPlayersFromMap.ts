import { CoreGameState, placeHQ, Axial } from "../../../shared";
import type { GameMapDefinition } from "../../../shared/maps/types";


export function shuffle<T>(arr: T[]) {
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

  shuffle(spawns);

  for (let i = 0; i < playerIds.length; i++) {
    const { q, r } = spawns[i];
    placeHQ(state, q, r, playerIds[i]);
    const p = state.players.get(playerIds[i])
    const newPos: Axial = { q, r };
    if (p)
      p.hqPos = newPos
  }
}

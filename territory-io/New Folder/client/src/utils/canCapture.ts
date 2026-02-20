// client/utils/canCaptureClient.ts
import { getTile, neighbors, captureCost, PlayerId, CoreGameState } from "../../../shared";

export function canCaptureClient(
  state: CoreGameState,
  playerId: PlayerId,
  q: number,
  r: number,
  connectedByPlayer: Map<PlayerId, Set<string>>
): boolean {
  const tile = getTile(state, q, r);
  const player = state.players.get(playerId);
  if (!tile || !player) return false;
  if (tile.ownerId === playerId) return false;

  const connected = connectedByPlayer.get(playerId);
  if (!connected) return false;

  // must be adjacent to an OWNED + CONNECTED tile
  for (const n of neighbors(q, r)) {
    const key = `${n.q},${n.r}`;
    const t = getTile(state, n.q, n.r);
    if (t?.ownerId === playerId && connected.has(key)) {
      return player.army >= captureCost(tile.defense);
    }
  }

  return false;
}

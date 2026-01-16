import { CoreGameState, PlayerId,PING_TIMEOUT,handlePlayerDeath, checkGameOver } from "../../../shared";

export function checkAFKPlayers(
  state: CoreGameState,
  now: number,
  onKick?: (playerId: PlayerId) => void
) {
  for (const [id, player] of state.players) {
    if (!player.lastSeen) {
        player.lastSeen = now;
        continue;
    }
    if (now - player.lastSeen > PING_TIMEOUT) {
      // Mark + cleanup gameplay state
      if (state.started) {
        handlePlayerDeath(state, id);
      }

      // Optional callback (socket close, logging, etc.)
      if (onKick) {
        onKick(id);
      }

      // Remove fully from state
      state.players.delete(id);
    }
  }

  // After removals, re-evaluate game state
  if (state.started) {
    checkGameOver(state);
  }
}

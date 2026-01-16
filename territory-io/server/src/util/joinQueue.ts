import { broadcast, startMatchIfReady, REQUIRED_PLAYERS } from "../index"
import { CoreGameState, PlayerId, PLAYER_COLORS, setPlayer, STARTING_GOLD, STARTING_ARMY} from "../../../shared"

export function handleJoinQueue(
  state: CoreGameState,
  playerId: PlayerId,
  username: string
) {
  if (state.players.has(playerId)) return;
  if (state.started && !state.gameOver) {
    // Match in progress → reject join
    return;
    }
  const color = PLAYER_COLORS[state.players.size % PLAYER_COLORS.length];

  setPlayer(state, {
    id: playerId,
    username,
    color: color,
    status: "QUEUED",
    gold: STARTING_GOLD,
    army: STARTING_ARMY,
    eliminated: false,
    hqPos: { q: 0, r: 0 },
    lastSeen: Date.now()
  });

  broadcast({ type: "LOBBY", connected: [...state.players.values()].filter(p => p.status === "QUEUED").length, required: REQUIRED_PLAYERS });
  startMatchIfReady();
}
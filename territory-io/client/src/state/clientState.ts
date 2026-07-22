
import type { CoreGameState } from "../../../shared/index.js";

export const clientUIState = {
  selectedBuilding: null as any,
  selectedAbility: null as any,
  phase: "LOBBY" as "LOBBY" | "QUEUED" | "PLAYING" | "GAME_OVER",
  username: "",
};

export const clientNetState = {
  playerId: null as string | null,
  state: null as CoreGameState | null,
  lobby: { connected: 0, required: 0 },
  serverClockOffset: 0,
};

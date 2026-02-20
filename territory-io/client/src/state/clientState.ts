
import type { CoreGameState } from "../../../shared";
import type { BuildingType } from "../../../shared";

export const clientUIState = {
  selectedBuilding: null as any,
  phase: "LOBBY" as "LOBBY" | "QUEUED" | "PLAYING" | "GAME_OVER",
  username: "",
};

export const clientNetState = {
  playerId: null as string | null,
  state: null as CoreGameState | null,
  lobby: { connected: 0, required: 0 }
};

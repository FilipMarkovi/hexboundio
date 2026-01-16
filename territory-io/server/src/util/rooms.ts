import {CoreGameState, PlayerId} from "../../../shared"

export type RoomId = string;

export type GameRoom = {
  id: RoomId;
  state: CoreGameState;
  playerIds: Set<PlayerId>;   // who is inside this room (queued or playing)
  lastTickMs: number;
  closing: boolean;           // to avoid double-destroy
};


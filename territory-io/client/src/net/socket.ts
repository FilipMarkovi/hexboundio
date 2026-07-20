// net.ts
import { deserializeState, type WireState } from "../../../shared/index.js";

export type PrivateLobbyMsg = {
  type: "PRIVATE_LOBBY";
  code: string;
  connected: number;
  required: number;
  players: Array<{ username: string }>;
  isHost?: boolean;
};

export type PrivateErrorMsg = {
  type: "PRIVATE_ROOM_ERROR";
  reason: string;
};

export type ServerMsg =
  | { type: "WELCOME"; playerId: string; requiredPlayers: number }
  | { type: "LOBBY"; connected: number; required: number }
  | { type: "STATE"; state: WireState }
  | { type: "LOG"; text: string; color?: string }
  | PrivateLobbyMsg
  | PrivateErrorMsg;

type ClientMsg =
  | { type: "INTENT"; intent: any }
  | { type: "AUTH"; token: string };

export function connect(url: string, handlers: {
  onWelcome: (playerId: string, requiredPlayers: number) => void;
  onLobby: (connected: number, required: number) => void;
  onState: (state: any) => void;
  onLog: (text: string, color?: string) => void;
  onPrivateLobby?: (msg: PrivateLobbyMsg) => void;
  onPrivateError?: (reason: string) => void;
}) {
  const ws = new WebSocket(url);

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data) as ServerMsg;

    switch (msg.type) {
      case "WELCOME":
        handlers.onWelcome(msg.playerId, msg.requiredPlayers);
        break;
      case "LOBBY":
        handlers.onLobby(msg.connected, msg.required);
        break;
      case "STATE":
        handlers.onState(deserializeState(msg.state));
        break;
      case "LOG":
        handlers.onLog(msg.text, msg.color);
        break;
      case "PRIVATE_LOBBY":
        handlers.onPrivateLobby?.(msg);
        break;
      case "PRIVATE_ROOM_ERROR":
        handlers.onPrivateError?.(msg.reason);
        break;
    }
  };

  function sendIntent(intent: any) {
    const out: ClientMsg = { type: "INTENT", intent };
    ws.send(JSON.stringify(out));
  }

  function tryAuth(token: any) {
    const out: ClientMsg = { type: "AUTH", token: token };
    ws.send(JSON.stringify(out));
  }

  return { ws, sendIntent, tryAuth };
}
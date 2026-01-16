
import { deserializeState, type WireState } from "../../../shared";

export type ServerMsg =
  | { type: "WELCOME"; playerId: string; requiredPlayers: number }
  | { type: "LOBBY"; connected: number; required: number }
  | { type: "STATE"; state: WireState };

export type ClientMsg = { type: "INTENT"; intent: any };

export function connect(url: string, handlers: {
  onWelcome: (playerId: string, requiredPlayers: number) => void;
  onLobby: (connected: number, required: number) => void;
  onState: (state: any) => void;
}) {
  const ws = new WebSocket(url);

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data) as ServerMsg;
    if (msg.type === "WELCOME") handlers.onWelcome(msg.playerId, msg.requiredPlayers);
    if (msg.type === "LOBBY") handlers.onLobby(msg.connected, msg.required);
    if (msg.type === "STATE") handlers.onState(deserializeState(msg.state));
  };

  function sendIntent(intent: any) {
    const out: ClientMsg = { type: "INTENT", intent };
    ws.send(JSON.stringify(out));
  }

  return { ws, sendIntent };
}

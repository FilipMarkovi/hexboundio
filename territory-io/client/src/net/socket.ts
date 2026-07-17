
import { deserializeState, type WireState } from "../../../shared/index.js";

export type ServerMsg =
  | { type: "WELCOME"; playerId: string; requiredPlayers: number }
  | { type: "LOBBY"; connected: number; required: number }
  | { type: "STATE"; state: WireState }
  | { type: "LOG"; text: string; color?: string };

type ClientMsg =
  | { type: "INTENT"; intent: any }
  | { type: "AUTH", token: string, };

export function connect(url: string, handlers: {
  onWelcome: (playerId: string, requiredPlayers: number) => void;
  onLobby: (connected: number, required: number) => void;
  onState: (state: any) => void;
  onLog: (text: string, color?: string) => void; 
}) {
  const ws = new WebSocket(url);

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data) as ServerMsg;
    if (msg.type === "WELCOME") handlers.onWelcome(msg.playerId, msg.requiredPlayers);
    if (msg.type === "LOBBY") handlers.onLobby(msg.connected, msg.required);
    if (msg.type === "STATE") handlers.onState(deserializeState(msg.state));
    if (msg.type === "LOG") {
      handlers.onLog(msg.text, msg.color);
    }
  };

  function sendIntent(intent: any) {
    const out: ClientMsg = { type: "INTENT", intent };
    ws.send(JSON.stringify(out));
  }

  function tryAuth(token: any){
    const out: ClientMsg = { type: "AUTH", token: token };
    ws.send(JSON.stringify(out));
  }

  return { ws, sendIntent, tryAuth };
}

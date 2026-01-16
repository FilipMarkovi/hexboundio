
import { WebSocketServer } from "ws";
import { checkAFKPlayers } from "./util/afk.js";
import crypto from "node:crypto";
import {
  createGameState,
  applyIntent,
  tick,
  serializeState,
  MAPS,
  PlayerId,
  handlePlayerDeath,
  CoreGameState,
  STARTING_GOLD, STARTING_ARMY,
  type WireState
} from "../../shared";
import { initMap } from "./init/initMap";
import { spawnPlayersFromMap } from "./init/spawnPlayersFromMap";
import { handleJoinQueue } from "./util/joinQueue.js";


type ClientMsg =
  | { type: "INTENT"; intent: any };

export type ServerMsg =
  | { type: "WELCOME"; playerId: string; requiredPlayers: number }
  | { type: "LOBBY"; connected: number; required: number }
  | { type: "STATE"; state: WireState };

const sockets = new Map<PlayerId, WebSocket>();
const map = MAPS.butterfly;
export const REQUIRED_PLAYERS = Array.from(map.hqSpawns).length;
const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });
const state = createGameState();
let last = Date.now();
let reset = true;

export function broadcast(msg: ServerMsg) {
  const data = JSON.stringify(msg);
  for (const ws of wss.clients) {
    if (ws.readyState === 1) ws.send(data);
  }
}

export function resetGame(state: CoreGameState) {
  // Reset match flags
  state.started = false;
  state.gameOver = null;

  // Clear tiles
  state.tiles.clear();

  // Reset players
  for (const p of state.players.values()) {
    p.status = "LOBBY";      // or "CONNECTED"
    p.eliminated = false;
    p.gold = STARTING_GOLD;
    p.army = STARTING_ARMY;
    p.hqPos = { q: 0, r: 0 };
  }

  // Clear caches
  state.connectedCache = new Map();
  reset = true
}

export function startMatchIfReady() {
  if (state.started) return;
  const queued = [...state.players.values()]
  .filter(p => p.status === "QUEUED");

  if (queued.length < REQUIRED_PLAYERS) return;

  for (const p of queued) {
    p.status = "PLAYING";
  }

  initMap(state, map);
  spawnPlayersFromMap(state, map);

  state.started = true;
  broadcast({ type: "STATE", state: serializeState(state) });
}

// SERVER TICK LOOP
setInterval(() => {
  checkAFKPlayers(state, Date.now(), (id) => {
    const ws = sockets.get(id);
    if (ws && ws.readyState === ws.OPEN) ws.close();
    sockets.delete(id);
    console.log("Player with id ", id, " disconneted!")
  });

  if (!state.started) return;

  const now = Date.now();

  //  FINAL STATE BROADCAST
  if (state.gameOver) {
    if(reset){
      reset = false
      broadcast({ type: "STATE", state: serializeState(state) });

      setTimeout(() => {
        resetGame(state);
        
        broadcast({ type: "STATE", state: serializeState(state) });
        broadcast({
          type: "LOBBY",
          connected: 0,
          required: REQUIRED_PLAYERS
        });

      }, 5000); // give players time to see winner
    }
    return;
  }

  const dt = (now - last) / 1000;
  last = now;

  tick(state, dt);
  broadcast({ type: "STATE", state: serializeState(state) });
}, 100);
 

wss.on("connection", (ws, req) => {
  const playerId = crypto.randomUUID();
  sockets.set(playerId, ws);

  ws.send(JSON.stringify({ type: "WELCOME", playerId, requiredPlayers: REQUIRED_PLAYERS } satisfies ServerMsg));
  ws.send(JSON.stringify({
    type: "LOBBY",
    connected: [...state.players.values()].filter(p => p.status === "QUEUED").length,
    required: REQUIRED_PLAYERS
  }));

  ws.on("message", (buf) => {
    let msg: ClientMsg | null = null;
    try { msg = JSON.parse(buf.toString()); } catch { return; }
    if (!msg) return;
    if (!msg || msg.type !== "INTENT" || !msg.intent) return;

    if (msg.intent.type === "JOIN_QUEUE") {
      handleJoinQueue(state, playerId, msg.intent.username)
      return;
    }

    if (msg.intent.type === "PING") {
      const player = state.players.get(playerId);
      if (player) {
        player.lastSeen = Date.now();
      }
      return;
    }

    applyIntent(state, playerId, msg.intent);
  
  });

  ws.on("close", () => {
    const player = state.players.get(playerId);

    if (player && !state.started) {
      state.players.delete(playerId);
    } else if (player) {
      handlePlayerDeath(state,playerId)
    }

    sockets.delete(playerId);

    broadcast({
      type: "LOBBY",
      connected: [...state.players.values()]
        .filter(p => p.status === "QUEUED").length,
      required: REQUIRED_PLAYERS
    });
  });

});

console.log(`Server running on ws://localhost:${PORT}`);

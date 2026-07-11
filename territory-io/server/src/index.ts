import { WebSocket, WebSocketServer } from "ws";
import { checkAFKPlayers } from "./util/afk.js";
import crypto from "node:crypto";
import {
  applyIntent,
  tick,
  serializeState,
  MAPS,
  handlePlayerDeath,
  PLAYER_COLORS,
  setPlayer, startHQPlacementCountdown,
  STARTING_GOLD, STARTING_ARMY, TICK_RATE,
  type WireState,
  checkGameOver
} from "../../system/index.js";
import { initMap } from "./init/initMap.js";
import { RoomId, GameRoom, createRoom  } from "./util/rooms.js";
import { runBots } from "./ai/botManager.js";
import { handleQueueBots } from "./ai/queueBotManager.js";
import { PlayerId } from "../../shared/index.js";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 6767;
const HOST = '0.0.0.0';
const app = express();

app.get("/", (_, res) => {
  res.send("Hexbound backend engine is running smoothly.");
});

const server =app.listen(PORT, HOST, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

type ClientMsg =
  | { type: "INTENT"; intent: any };

export type ServerMsg =
  | { type: "WELCOME"; playerId: string; requiredPlayers: number }
  | { type: "LOBBY"; connected: number; required: number }
  | { type: "STATE"; state: WireState };

const rooms = new Map<RoomId, GameRoom>();
let queueRoomId: RoomId;
const playerRoom = new Map<PlayerId, RoomId>(); // player -> room
const sockets = new Map<PlayerId, WebSocket>();
const intentHistory = new Map<PlayerId, number[]>();

const wss = new WebSocketServer({ server });
let last = Date.now();
let reset = true;
;
const first = createRoom(rooms);
queueRoomId = first.id;

export function sendPlayerLog(playerId: string, text: string, color: string = "#ffffff") {
  const socket = sockets.get(playerId);
  if (socket && socket.readyState === 1) {
    socket.send(JSON.stringify({
      type: "LOG",
      text,
      color
    }));
  }
}

export function broadcastRoomLog(room: GameRoom, text: string, color: string = "#ffffff") {
  const msg = JSON.stringify({ type: "LOG", text, color });
  
  room.playerIds.forEach(id => {
    const socket = sockets.get(id);
    if (socket && socket.readyState === 1) {
      socket.send(msg);
    }
  });
}

function getQueueRoom(): GameRoom {
  let room = rooms.get(queueRoomId);
  if (!room) {
    room = createRoom(rooms);
    queueRoomId = room.id;
  }
  return room;
}

function queuedCount(room: GameRoom) {
  return [...room.state.players.values()].filter(p => p.status === "QUEUED").length;
}

export function broadcastLobby() {
  const room = getQueueRoom();
  const msg = JSON.stringify({
    type: "LOBBY",
    connected: queuedCount(room),
    required: room.maxPlayers
  });

  for (const ws of sockets.values()) {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  }
}

function handleJoinQueue(playerId: PlayerId, username: string) {
  // Already in a room? ignore (or allow leaving later)
  if (playerRoom.has(playerId)) return;

  const room = getQueueRoom();

  // Add player to this room’s state
  const color = PLAYER_COLORS[room.state.players.size % PLAYER_COLORS.length];

  setPlayer(room.state, {
    id: playerId,
    username,
    color,
    status: "QUEUED",
    gold: STARTING_GOLD,
    army: STARTING_ARMY,
    eliminated: false,
    hqPos: { q: 0, r: 0 },
    lastSeen: Date.now(),
    buildings: {
      fort: 0,
      barracks: 0,
      house: 0,
      laboratory: 0,
      siege_outpost: 0,
    },
    effects: []
  });

  room.playerIds.add(playerId);
  playerRoom.set(playerId, room.id);

  broadcastLobby();
  handleQueueBots(room, playerRoom);
  startMatchIfReady(room);
}

function handleReturnToLobby(pid: PlayerId) {
  const roomid = playerRoom.get(pid)
  if(!roomid) return;

  const room = rooms.get(roomid)
  if (!room) return;

  const state = room.state
  if (!state) return;
 
  let player = state.players.get(pid)
  if(!player) return;
  // Remove player from game state
  handlePlayerDeath(state, pid);

  // Update status
  player.status = "LOBBY";
  room.playerIds.delete(pid)
  playerRoom.delete(pid);
  

  // Broadcast update
  broadcastRoomState(room);
  broadcastLobby()
}

function broadcastRoom(room: GameRoom, msg: ServerMsg) {
  const data = JSON.stringify(msg);
  for (const pid of room.playerIds) {
    const ws = sockets.get(pid);
    if (ws && ws.readyState === ws.OPEN) ws.send(data);
  }
}

function broadcastRoomState(room: GameRoom) {
  broadcastRoom(room, { type: "STATE", state: serializeState(room.state) });
}

function destroyRoomSoon(roomId: RoomId) {
  const room = rooms.get(roomId);
  if (!room || room.closing) return;
  room.closing = true;

  setTimeout(() => {
    const r = rooms.get(roomId);
    if (!r) return;

    // Return all its players to lobby (not queued, just free to click Play again)
    for (const pid of r.playerIds) {
      playerRoom.delete(pid);
      // Optional: tell client “you are in lobby now” via LOBBY message already
      // (clients also stop receiving STATE since room is gone)
    }

    rooms.delete(roomId);

    // Everyone sees the lobby count for current queue room
    broadcastLobby();
  }, 5000); // allow winner screen for 5s
}

export function startMatchIfReady(room: GameRoom) {
  if (room.state.started) return;

  const queued = [...room.state.players.values()].filter(p => p.status === "QUEUED");
  if (queued.length < room.maxPlayers) return;

  // Move queued -> playing
  for (const p of queued) p.status = "PLAYING";

  const map = MAPS.get(room.mapId);
  if (!map) {
    throw new Error(`Map not found at match start: ${room.mapId}`);
  }

  // Init map
  initMap(room.state, map);

  startHQPlacementCountdown(room.state, room.id)
  room.lastTickMs = Date.now();

  broadcastRoomState(room);

  // mmediately create a new queue room (fresh lobby target)
  const newRoom = createRoom(rooms);
  queueRoomId = newRoom.id;

  broadcastLobby();
}

let bot_tick = 8;
// SERVER TICK LOOP
setInterval(() => {
  const now = Date.now();
  bot_tick = (bot_tick + 1) % 9
  for (const room of rooms.values()) {
    if (!room.state.started) continue;
    if (room.closing) continue;

    // Game over handling
    if (room.state.gameOver) {
      broadcastRoomState(room);
      destroyRoomSoon(room.id);
      continue;
    }

    const dt = (now - room.lastTickMs) / 1000;
    room.lastTickMs = now;
    if (bot_tick == 0)
      runBots(room);
    tick(room.state, dt);
    checkGameOver(room.state)
    broadcastRoomState(room);
  }
  //console.log("tick time: ",Date.now() - now, ", Rooms count: ", rooms.size, " Player count: ", playerRoom.size)
}, TICK_RATE);
 

wss.on("connection", (ws, req) => {
  const playerId = crypto.randomUUID();
  sockets.set(playerId, ws);
  const room = getQueueRoom()
  ws.send(JSON.stringify({ type: "WELCOME", playerId, requiredPlayers: room.maxPlayers } satisfies ServerMsg));
  ws.send(JSON.stringify({
    type: "LOBBY",
    connected: queuedCount(getQueueRoom()),
    required: room.maxPlayers
  }));

  ws.on("message", (buf) => {
    const now = Date.now();
    let history = intentHistory.get(playerId) || [];
      // Filter out timestamps older than 1 second
    history = history.filter(time => now - time < 1000);
    
    if (history.length >= 10) {
      // ws.send(JSON.stringify({ type: "ERROR", msg: "Too many actions!" }));
      return; 
    }
    history.push(now);
    intentHistory.set(playerId, history);

    let msg: ClientMsg | null = null;
    try { msg = JSON.parse(buf.toString()); } catch { return; }
    if (!msg || msg.type !== "INTENT" || !msg.intent) return;

    const intent = msg.intent;

    if (intent.type === "JOIN_QUEUE") {
      if (intent.username && intent.username.length > 15) {
        intent.username = intent.username.substring(0, 15);
      }
      handleJoinQueue(playerId, intent.username);
      return;
    }

    if (intent.type === "RETURN_LOBBY") {
      handleReturnToLobby(playerId)
      return;
    }

    if (intent.type === "PING") {
      const rid = playerRoom.get(playerId);
      if (!rid) return;
      const room = rooms.get(rid);
      if (!room) return;
      const p = room.state.players.get(playerId);
      if (p) p.lastSeen = Date.now();
      return;
    }

    // Gameplay intents only if player is in a room
    const rid = playerRoom.get(playerId);
    if (!rid) return;

    const room = rooms.get(rid);
    if (!room) return;

    applyIntent(room.state, playerId, intent);
  });

  ws.on("close", () => {
    sockets.delete(playerId);
    intentHistory.delete(playerId);

    const rid = playerRoom.get(playerId);
    if (!rid) {
      broadcastLobby();
      return;
    }

    const room = rooms.get(rid);
    if (!room) {
      playerRoom.delete(playerId);
      broadcastLobby();
      return;
    }

    const player = room.state.players.get(playerId);

    if (player?.status === "PLAYING") {
      // Treat disconnect as defeat
      handlePlayerDeath(room.state, playerId);
    }

    // Remove player bookkeeping
    room.playerIds.delete(playerId);
    room.state.players.delete(playerId);
    playerRoom.delete(playerId);

    // Update lobby if needed
    if (rid === queueRoomId) broadcastLobby();

    // Cleanup empty running games
    if (room.state.started && room.playerIds.size === 0) {
      rooms.delete(rid);
    }
  });

});

console.log(`Server running on ws://localhost:${PORT}`);

// server/ai/botManager.ts

import type { GameRoom } from "../util/rooms";
import { applyIntent } from "../../../system";
import { simpleAI, smartAI } from "./simpleExpandBot";

export function runBots(room: GameRoom) {
  for (const [pid, player] of room.state.players) {
    if (!player.isBot) continue;
    if (player.eliminated) continue;
    if (player.status !== "PLAYING") continue;
    if (Math.random() < 0.8) { // 80% of the time, send intent for bot
        const intent = smartAI(room.state, pid);
        if (intent) {
            applyIntent(room.state, pid, intent);
        }
    }
  }
}

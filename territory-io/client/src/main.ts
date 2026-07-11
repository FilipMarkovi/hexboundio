
import { 
  drawHexBatch, 
  getTileColor, 
  drawHexEffectsBatch, 
  drawBuildingsBatch, 
  drawCaptureHexBatch, 
  drawBuildingProgressBarsBatch 
} from "./render/hexRender.js";
import { drawHexTextBatch } from "./render/text.js";
import { pixelToAxial } from "./utils/hexMath.js";
import { drawHUD,drawTargetingHUD } from "./ui/hud.js";
import { connect } from "./net/socket.js";
import { clientNetState,clientUIState } from "./state/clientState.js";
import type { CoreGameState, PlayerId } from "../../shared/index.js";
import { initPan } from "./input/pan.js";
import { initZoom } from "./input/zoom.js";
import { camera } from "./render/camera.js";
import { HEX_SIZE } from "./constants/index.js";
import { clearBuildMode } from "./ui/buildMode.js";
import { initKeyboard } from "./input/keyboard.js";
import { initBuildButtons, updateBuildButtons } from "./ui/buildButtons.js";
import { getConnectedTilesFromHQ_Client } from "./utils/supply.js";
import { drawTileInfo } from "./ui/tileInfo.js";
import { initLobbyUI, updateLobbyUI } from "./ui/lobby.js";
import { addGameLog, drawGameLogs } from "./ui/hud.js";
import { loadGameTextures } from "./render/assetManager.js";
import { initPlacementTimerUI,updatePlacementTimerUI } from "./ui/placementTimer.js";
import { clearAbilityMode } from "./ui/abilityMode.js";

let mouseDownPos: { x: number; y: number } | null = null;
let didDrag = false;
let hoveredHex: { q: number; r: number } | null = null;
export let connectedByPlayer = new Map<PlayerId, Set<string>>();
export let myPlannedBuildingCounts: Record<string, number> = {};
export let myConTileCount: number | null = 0;

const DRAG_THRESHOLD = 14; // pixels

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = window.location.hostname === "localhost"
  ? "ws://localhost:8080" 
  : "wss://server.hexbound.io";

export const { sendIntent } = connect(wsUrl, {
  onWelcome: (id, requiredPlayers) => {
    clientNetState.playerId = id;
    clientNetState.lobby = { connected: 0, required: requiredPlayers };
  },
  onLobby: (connected, required) => {
    clientNetState.lobby = { connected, required };
  },
  onLog: (text, color) => {
    addGameLog(text, color);
  },
  onState: (state) => {
    clientNetState.state = state;

    connectedByPlayer.clear();
    for (const p of state.players.values()) {
      if (!p.eliminated) {
        connectedByPlayer.set(p.id, getConnectedTilesFromHQ_Client(state, p.id));
      }
    }

    // Tracking under construction and active buildings for button greyout limits
    myPlannedBuildingCounts = {};

    const meId = clientNetState.playerId;
    if (meId && state) {
      for (const tile of state.tiles.values()) {
        if (tile.ownerId === meId) {
          // Track existing, fully operational layouts
          if (tile.building) {
            const bKey = tile.building.toLowerCase();
            myPlannedBuildingCounts[bKey] = (myPlannedBuildingCounts[bKey] || 0) + 1;
          }
          // Track building footprints currently under a construction timer
          if (tile.buildingAction && tile.buildingAction.actionType === "CONSTRUCTING") {
            const bKey = tile.buildingAction.building.toLowerCase();
            myPlannedBuildingCounts[bKey] = (myPlannedBuildingCounts[bKey] || 0) + 1;
          }
        }
      }
    }
    
    myConTileCount = connectedByPlayer.get(meId ?? "")?.size ?? 0;

    const me = meId ? state.players.get(meId) : null;

    if (state.gameOver) {
      clientUIState.phase = "GAME_OVER";
      return;
    }

    if (me?.status === "PLAYING") {
      clientUIState.phase = "PLAYING";
    } else if (me?.status === "QUEUED") {
      clientUIState.phase = "QUEUED";
    } else {
      clientUIState.phase = "LOBBY";
    }

    if (!state.started) {
      hoveredHex = null;
      clientUIState.selectedBuilding = null;
    }
  }
});

const canvas = document.getElementById("c") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
loadGameTextures(ctx, () => {});

initLobbyUI(sendIntent);
initPan(canvas);
initZoom(canvas);
initBuildButtons();
initKeyboard();
initPlacementTimerUI();


function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

canvas.addEventListener("mousedown", (e) => {
  mouseDownPos = { x: e.clientX, y: e.clientY };
  didDrag = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!mouseDownPos) return;

  const dx = e.clientX - mouseDownPos.x;
  const dy = e.clientY - mouseDownPos.y;

  if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
    didDrag = true;
  }
});

// hover hex
canvas.addEventListener("mousemove", (e) => {
const rect = canvas.getBoundingClientRect()

const screenX = e.clientX - rect.left
const screenY = e.clientY - rect.top

  const worldX =
    (screenX - canvas.width / 2) / camera.zoom + camera.x
  const worldY =
    (screenY - canvas.height / 2) / camera.zoom + camera.y  
  const { q, r } = pixelToAxial(
  worldX,
  worldY,
  HEX_SIZE,
  0,
  0
);
  hoveredHex = { q, r };
});

// attack / place building / defend
canvas.addEventListener("click", () => {
  if (clientUIState.phase !== "PLAYING") return;
  if(didDrag || !hoveredHex) return

  if (clientNetState.state?.phase === "HQ_PLACEMENT") {
    sendIntent({
      type: "PLACE_HQ",
      q: hoveredHex.q,
      r: hoveredHex.r
    });
    return; 
  }

  // ability select mode
  const activeAbility = clientUIState.selectedAbility;
  if (activeAbility) {
    const tile = clientNetState.state?.tiles.get(`${hoveredHex.q},${hoveredHex.r}`);

    if (tile) {
      sendIntent({
        type: "BUY_PLAYER_EFFECT",
        effectType: activeAbility,
        targetPlayerId: tile.ownerId
      }); 
    }

    clearAbilityMode();
    return;
  }

  // BUILD MODE ACTIVE
  const selected = clientUIState.selectedBuilding;
  if (selected) {
    const tile = clientNetState.state?.tiles.get(
      `${hoveredHex.q},${hoveredHex.r}`
    );

    if (tile && tile.ownerId === clientNetState.playerId) {
      sendIntent({
        type: "BUILD",
        q: hoveredHex.q,
        r: hoveredHex.r,
        buildingType: selected
      });
    }

    // Either way, cancel build mode after click
    clearBuildMode();
    return;
  }

  const state = clientNetState.state;
  const me = clientNetState.playerId;
  if (!state || !me) return;

  const tile = state.tiles.get(`${hoveredHex.q},${hoveredHex.r}`);
  if (!tile) return;

  // If tile is owned by me - defend
  if (tile.ownerId === me && tile.capture && tile.capture.by !== me) {
    sendIntent({
      type: "DEFEND",
      q: hoveredHex.q,
      r: hoveredHex.r
    });
    return;
  }

  // NORMAL MODE - capture
  if (tile.ownerId !== me) {
    sendIntent({ type: "CAPTURE", q: hoveredHex.q, r: hoveredHex.r });
  }
});

// demolish building
canvas.addEventListener("mousedown", (e) => {
  if (clientUIState.phase !== "PLAYING") return;
  if (e.button !== 2) return
  if (!hoveredHex) return;

  const state = clientNetState.state;
  const me = clientNetState.playerId;
  if (!state || !me) return;

  const tile = state.tiles.get(
    `${hoveredHex.q},${hoveredHex.r}`
  );

  if (
    tile &&
    tile.ownerId === me &&
    tile.building &&
    tile.building !== "HQ"
  ) {
    sendIntent({
      type: "DEMOLISH",
      q: hoveredHex.q,
      r: hoveredHex.r
    });
  }
});

window.addEventListener("mouseup", () => {
  mouseDownPos = null;
});

let lastTime = performance.now();
export let deltaTime = 0;

function loop() {
  const currentTime = performance.now();
  deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  requestAnimationFrame(loop);
  if (clientUIState.phase !== "GAME_OVER")
    ctx.clearRect(0, 0, canvas.width, canvas.height);

  const state = clientNetState.state as CoreGameState | null;
  const me = clientNetState.playerId;

  updateLobbyUI();
  updatePlacementTimerUI(state);
  updateBuildButtons(state, me, myPlannedBuildingCounts);

  const canRenderMap =
    state &&
    me &&
    (clientUIState.phase === "PLAYING" ||
     clientUIState.phase === "GAME_OVER");

  if (!canRenderMap) 
    return;
    
  ctx.fillStyle = "#0c0c0cff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (state && me) {
    const halfW = canvas.width / 2;
    const halfH = canvas.height / 2;
    const cullRadius = HEX_SIZE * camera.zoom * 2.0;

    // 1. ALLOCATION-FREE SCREEN PREPARATION ARRAYS
    const visibleTiles: any[] = [];

    for (const tile of state.tiles.values()) {
      const worldX = HEX_SIZE * (Math.sqrt(3) * tile.q + (Math.sqrt(3) / 2) * tile.r);
      const worldY = HEX_SIZE * (1.5 * tile.r); 
      const x = (worldX - camera.x) * camera.zoom + halfW;
      const y = (worldY - camera.y) * camera.zoom + halfH;

      // Viewport Frustum Culling
      if (x < -cullRadius || x > canvas.width + cullRadius || y < -cullRadius || y > canvas.height + cullRadius) {
        continue;
      }

      const owner = tile.ownerId;
      let isCutOff = false;
      const hovered = (tile.q === hoveredHex?.q && tile.r === hoveredHex?.r);

      if (owner) {
        const connected = connectedByPlayer.get(owner);
        if (connected && !connected.has(`${tile.q},${tile.r}`)) {
          isCutOff = true;
        }
      }

      // Garbage Collection Fix: Arguments passed directly with zero object instantiations
      const { color, fillAlpha } = getTileColor(
        tile,
        hovered,
        state,
        me,
        isCutOff,
        connectedByPlayer
      );
      
      const isTileHovered = (hoveredHex?.q === tile.q && hoveredHex?.r === tile.r);

      let captureColor = "#fff";
      if (tile.capture) {
        const attacker = state.players.get(tile.capture.by);
        captureColor = attacker?.color ?? "#fff";
      }

      visibleTiles.push({
        tile,
        x,
        y,
        worldX,
        worldY,
        color,
        fillAlpha,
        isHovered: isTileHovered,
        captureColor
      });
    }

    // =================================================================
    // THE HIGH-PERFORMANCE BATCHED RECONSTRUCTION PIPELINE
    // =================================================================
    
    // Pass A: Hex layouts, Terrain patterns, and Grid lines
    drawHexBatch(ctx, visibleTiles, HEX_SIZE);

    // Pass B: Stun flashes and orange defensive heat elements
    drawHexEffectsBatch(ctx, visibleTiles, HEX_SIZE);

    // Pass C: Base foundation pads and building vector curves
    drawBuildingsBatch(ctx, visibleTiles, HEX_SIZE);

    // Pass D: Real-time action/construction progress counters
    drawBuildingProgressBarsBatch(ctx, visibleTiles, HEX_SIZE);

    // Pass E: Smooth sector conquest border tracking animations
    drawCaptureHexBatch(ctx, visibleTiles, HEX_SIZE, deltaTime);

    // Pass F: Vector font rendering isolated behind a Level of Detail (LOD) threshold
    if (camera.zoom > 0.75) {
      drawHexTextBatch(ctx, visibleTiles, HEX_SIZE);
    }

    // Hovered tile information popup card (Kept separate out of the core map layout loops)
    if (hoveredHex) {
      const hoveredTile = state.tiles.get(`${hoveredHex.q},${hoveredHex.r}`);
      if (hoveredTile && !state.gameOver) {
        drawTileInfo(ctx, hoveredTile, state, me);
      }
    }
  }

  drawHUD(ctx);
  drawTargetingHUD(ctx);
  drawGameLogs(ctx);
}

setInterval(() => {
  sendIntent({ type: "PING" });
}, 2000);

loop();

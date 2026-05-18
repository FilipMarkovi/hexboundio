
import { drawHex, getTileColor, drawCaptureHex, drawHexEffects, drawBuildingIcon } from "./render/hexRender";
import { drawHexText } from "./render/text";
import { pixelToAxial } from "./utils/hexMath";
import { drawHUD,drawBuildMode } from "./ui/hud";
import { connect } from "./net/socket";
import { clientNetState,clientUIState } from "./state/clientState";
import type { CoreGameState, PlayerId } from "../../shared";
import { initPan } from "./input/pan";
import { initZoom } from "./input/zoom";
import { camera } from "./render/camera";
import { HEX_SIZE } from "./constants";
import { clearBuildMode } from "./ui/buildMode";
import { initKeyboard } from "./input/keyboard";
import { initBuildButtons, updateBuildButtons } from "./ui/buildButtons";
import { getConnectedTilesFromHQ_Client } from "./utils/supply";
import { drawTileInfo } from "./ui/tileInfo";
import { initLobbyUI, updateLobbyUI } from "./ui/lobby";
import { addGameLog, drawGameLogs } from "./ui/hud";
import { loadGameTextures } from "./render/assetManager";
import { initPlacementTimerUI,updatePlacementTimerUI } from "./ui/placementTimer";

let mouseDownPos: { x: number; y: number } | null = null;
let didDrag = false;
let hoveredHex: { q: number; r: number } | null = null;
export let connectedByPlayer = new Map<PlayerId, Set<string>>();
export let myConTileCount: number | null = 0;

const DRAG_THRESHOLD = 14; // pixels

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${window.location.host}`;

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

    const meId = clientNetState.playerId;
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

  const selected = clientUIState.selectedBuilding;
  // BUILD MODE ACTIVE
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
  updateBuildButtons(state, me);

  const canRenderMap =
  state &&
  me &&
  (clientUIState.phase === "PLAYING" ||
   clientUIState.phase === "GAME_OVER");

  if (!canRenderMap) 
    return;
  ctx.fillStyle = "#0c0c0cff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);


  if (state)
    {
      connectedByPlayer.clear();
      for (const p of state.players.values()) {
        if (!p.eliminated) {
          connectedByPlayer.set(
            p.id,
            getConnectedTilesFromHQ_Client(state, p.id)
          );
        }
      }
    }
  myConTileCount = connectedByPlayer.get(me)?.size ?? 0;

  if (state && me) {
    for (const tile of state.tiles.values()) {
      const owner = tile.ownerId;
      let isCutOff = false;
      let hovered = (tile.q === hoveredHex?.q && tile.r === hoveredHex?.r)

      if (owner) {
        const connected = connectedByPlayer.get(owner);
        if (connected && !connected.has(`${tile.q},${tile.r}`)) {
          isCutOff = true;
        }
      }

      const { color, fillAlpha } = getTileColor({
        tile,
        hovered,
        state,
        playerId: me,
        isCutOff,
        connectedByPlayer
      });
      const isTileHovered = (hoveredHex?.q === tile.q && hoveredHex?.r === tile.r);
      drawHex(ctx, tile.q, tile.r, HEX_SIZE, color, tile.terrain, tile.ownerId, fillAlpha, isTileHovered);
      drawHexEffects(ctx, tile.q, tile.r, HEX_SIZE, tile);
      

      const text = tile.defense.toString();
      const label = text;
      if(tile.building)
        drawBuildingIcon(ctx, tile.q, tile.r, HEX_SIZE, tile.building, color);
      drawHexText(ctx, tile.q, tile.r, HEX_SIZE, label, !!tile.building);

      if (tile.capture) {
        const attacker = state.players.get(tile.capture.by);
        const ringColor = attacker?.color ?? "#fff";
        drawCaptureHex(
          ctx,
          tile.q,
          tile.r,
          HEX_SIZE,
          tile.capture.progress,
          ringColor,
          deltaTime
        );
      }
      
    }

    // UI for hovered tile info
    if(hoveredHex){
      const hoveredTile = state.tiles.get(
        `${hoveredHex?.q},${hoveredHex?.r}`
      );
      if (hoveredTile && !state.gameOver) {
        drawTileInfo(ctx, hoveredTile, state, me);
      }
    }
  }

  drawHUD(ctx);
  drawBuildMode(ctx);
  drawGameLogs(ctx)
  
}

setInterval(() => {
  sendIntent({ type: "PING" });
}, 2000);

loop();

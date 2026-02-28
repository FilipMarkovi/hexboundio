
import { clientNetState } from "../state/clientState";
import { clientUIState } from "../state/clientState";
import { BASE_GOLD_MAX, BASE_ARMY_MAX, ARMY_CAP_PER_TILE, TICK_RATE, HOUSE_ARMY_CAP_BONUS} from "../constants";
import { myConTileCount } from "../main";
import { tick } from "../../../shared";

let lastArmy = 0;
let lastGold = 0;
let displayedArmyGain = "0";
let displayedGoldGain = "0";
const ticking = 1000 / TICK_RATE

// Helper for rounded rectangles (better aesthetics)
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStatBar(
  ctx: CanvasRenderingContext2D, 
  x: number, y: number, 
  val: number, 
  max: number, 
  label: string, 
  color: string,
  gain: string
) {
  const width = 180;
  const height = 18;
  const centerY = y + height / 2;
  
  // 1. Background
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  roundRect(ctx, x, y, width, height, 4);
  ctx.fill();

  // 2. Progress fill
  const fillWidth = Math.min(width, (val / max) * width);
  ctx.fillStyle = color;
  if (fillWidth > 0) {
    roundRect(ctx, x, y, fillWidth, height, 4);
    ctx.fill();
  }

  // 3. Text (Perfectly Centered Vertically)
  ctx.textBaseline = "middle";
  ctx.font = "bold 11px sans-serif";
  
  // Left Label
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 8, centerY);
  
  // Right Numbers: Current / Max (+Gain)
  ctx.textAlign = "right";
  // The gain is shown in brackets next to the total
  const statText = `${Math.floor(val)} / ${max} (+${gain}/s)`;
  ctx.fillText(statText, x + width - 8, centerY);
}

export function drawHUD(ctx: CanvasRenderingContext2D) {
  const state = clientNetState.state;
  const me = clientNetState.playerId ? state?.players.get(clientNetState.playerId) : null;

  if (!state || !me) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(10, 10, 150, 30);
    ctx.fillStyle = "#fff";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Connecting...`, 20, 30);
    return;
  }

  // 1. Panel Background
  ctx.fillStyle = "rgba(20, 20, 25, 0.8)";
  roundRect(ctx, 8, 8, 200, 90, 8);
  ctx.fill();
  ctx.strokeStyle = me.color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 2. Player Name
  ctx.fillStyle = me.color;
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "left";
  if(me.username)
    ctx.fillText(me.username, 15, 28);
  else
    ctx.fillText("unknown", 15, 28);

  const effectiveOwned = Math.max(0, (myConTileCount ?? 0) - 1);
  const currentArmyMax = BASE_ARMY_MAX + (effectiveOwned * ARMY_CAP_PER_TILE) + (me.buildings.house ?? 0) * HOUSE_ARMY_CAP_BONUS;
  const ratio = me.army / currentArmyMax;

  if (me.army > lastArmy) {
      displayedArmyGain = ((me.army - lastArmy) * ticking).toFixed(1); 
  }

  if (me.gold > lastGold) {
      displayedGoldGain = ((me.gold - lastGold) * ticking).toFixed(1);
  }
  if (me.army == currentArmyMax)
    displayedArmyGain = "0";
  if(me.gold == BASE_GOLD_MAX)
    displayedGoldGain = "0";

  lastArmy = me.army;
  lastGold = me.gold;

  // 3. Army bar
  drawStatBar(ctx, 18, 40, me.army, currentArmyMax, "ARMY", "#ef4444", displayedArmyGain);

  // 4. Gold Bar
  drawStatBar(ctx, 18, 65, me.gold, BASE_GOLD_MAX, "GOLD", "#eab308", displayedGoldGain);

  // 5. Game Over Overlay
  if (state.gameOver) {
    
    ctx.textAlign = "center";
    ctx.fillStyle = "#f87171";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("GAME OVER", ctx.canvas.width / 2, ctx.canvas.height / 2 - 160);
    
    ctx.fillStyle = "#fff";
    ctx.font = "24px sans-serif";
    ctx.fillText(`Winner: ${state.gameOver.winner}`, ctx.canvas.width / 2, ctx.canvas.height / 2 - 110);
  }
}

export function drawBuildMode(ctx: CanvasRenderingContext2D) {
  if (!clientUIState.selectedBuilding) return;

  const text = `🔨 CONSTRUCTING: ${clientUIState.selectedBuilding}`;
  ctx.font = "bold 14px sans-serif";
  const metrics = ctx.measureText(text);
  const padding = 20;
  const w = metrics.width + padding * 2;
  
  // Center the bar at the top
  const x = (ctx.canvas.width - w) / 2;

  ctx.fillStyle = "rgba(0,0,0,0.8)";
  roundRect(ctx, x, 10, w, 30, 15);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(text, ctx.canvas.width / 2, 30);
  
  ctx.font = "10px sans-serif";
}
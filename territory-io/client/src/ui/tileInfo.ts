import type { CoreGameState, TileState } from "../../../shared";
import { DEFEND_COST_RATIO, DEFENSE_HEAT_DECAY_MS, DEFENSE_COST_INCREMENT } from "../constants";

export function drawTileInfo(
  ctx: CanvasRenderingContext2D,
  tile: TileState,
  state: CoreGameState,
  me: string
) {
  // Save state to prevent HUD/Game Over text from moving/changing
  ctx.save();
  const now = Date.now();

  const width = 230;
  const padding = 16;
  const lineHeight = 22;
  const x = ctx.canvas.width - width - 20;
  const y = 20;

  // 1. Data Processing
  const isMine = tile.ownerId === me;
  const owner = tile.ownerId ? state.players.get(tile.ownerId) : null;
  const ownerColor = isMine ? "#60a5fa" : (owner?.color ?? "#9ca3af");
  const ownerName = isMine ? "You" : (owner?.username ?? "Neutral");

  const lines: { label: string; value: string; color?: string }[] = [
    { label: "TERRAIN", value: tile.terrain, color: getTerrainColor(tile.terrain) },
    { label: "OWNER", value: ownerName, color: ownerColor },
  ];

  if (tile.building) {
    lines.push({ label: "BUILDING", value: tile.building, color: "#facc15" });
  }

  lines.push({ label: "BASE DEF", value: tile.baseDefense.toString() });
  lines.push({ label: "TOTAL DEF", value: tile.defense.toString(), color: "#f97316" });

  if (owner && !isMine) {
    lines.push({ 
      label: "ARMY", 
      value: Math.round(owner.army).toLocaleString(), 
      color: "#ef4444" // Bright Red
    });
    lines.push({ 
      label: "GOLD", 
      value: Math.round(owner.gold).toLocaleString(), 
      color: "#fbbf24" // Gold/Amber
    });
  }

  // 2. Defense Cost Logic (Only show for owned tiles under attack)
  const effectiveHeat = tile.defenseHeat;
  const msSinceLastDef = now - tile.lastDefendedAt;

  if (owner) {
    let costPercent = Math.round((effectiveHeat * DEFENSE_COST_INCREMENT + DEFEND_COST_RATIO) * 100);
    // Calculate remaining seconds for the countdown
    let timerText = "";
    if (effectiveHeat > 0) {
      const secondsLeft = Math.ceil((DEFENSE_HEAT_DECAY_MS - msSinceLastDef) / 1000);
      timerText = ` (${secondsLeft}s)`;
      if (secondsLeft < 0){
        costPercent = DEFEND_COST_RATIO * 100
        timerText = ""
      }
    }

    lines.push({ 
      label: "DEFENSE COST", 
      value: `${costPercent}%${timerText}`, 
      color: effectiveHeat > 0 ? "#f87171" : "#34d399" 
    });
  }

  // Attack Cooldown Check
  const COOLDOWN_MS = 1000;
  if (msSinceLastDef < COOLDOWN_MS) {
    lines.push({ 
      label: "STATUS", 
      value: "ATTACK COOLDOWN", 
      color: "#fbbf24" // Amber/Yellow color
    });
  }

  const height = padding * 2 + lines.length * lineHeight + 10;

  // 3. Draw Background Panel
  ctx.fillStyle = "rgba(15, 15, 20, 0.9)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, x, y, width, height, 10);
  ctx.fill();
  ctx.stroke();

  // 4. Draw Owner Side-Bar
  ctx.fillStyle = ownerColor;
  drawRoundedRect(ctx, x, y, 5, height, { tl: 10, bl: 10, tr: 0, br: 0 });
  ctx.fill();

  // 5. Render Text Lines
  ctx.textBaseline = "top";
  let ty = y + padding;

  for (const line of lines) {
    // Label (Left aligned, small)
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.textAlign = "left";
    ctx.fillText(line.label, x + padding + 8, ty + 2);

    // Value (Right aligned, main font)
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = line.color ?? "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText(line.value, x + width - padding, ty);

    ty += lineHeight;
  }

  // Restore state to fix the "moving text" bug in other HUD elements
  ctx.restore();
}

// Helper: Terrain Colors
function getTerrainColor(t: string) {

  if (t === "DESERT") return "#dd9f1b";
  if (t === "MOUNTAIN") return "#8a8a8a";
  if (t === "WATER") return "#257db8";
  return "#6ee7b7"; // Grass
}

// Helper: Rounded Rect with individual corner control
function drawRoundedRect(ctx: any, x: number, y: number, w: number, h: number, r: any) {
  const c = typeof r === 'number' ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + c.tl, y);
  ctx.lineTo(x + w - c.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + c.tr);
  ctx.lineTo(x + w, y + h - c.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - c.br, y + h);
  ctx.lineTo(x + c.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - c.bl);
  ctx.lineTo(x, y + c.tl);
  ctx.quadraticCurveTo(x, y, x + c.tl, y);
  ctx.closePath();
}
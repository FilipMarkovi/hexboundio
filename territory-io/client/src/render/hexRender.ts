
import type { TileState, PlayerId, BuildingType } from "../../../shared";
import { canCaptureClient } from "../utils/canCapture";
import { camera } from "./camera";
import { getStripePattern } from "./patterns";
import { FILL_ALPHA } from "../constants";
import { darken } from "./playerColors";
import { DEFENSE_HEAT_DECAY_MS } from "../constants";
import { tileTextures } from "./assetManager";

/** 
export function drawCaptureHex(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  size: number,
  progress: number,
  color: string
) {
  // 1. Calculate Center Position (Matches your hex drawing)
  const worldX = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const worldY = size * (3 / 2 * r);
  const centerX = (worldX - camera.x) * camera.zoom + ctx.canvas.width / 2;
  const centerY = (worldY - camera.y) * camera.zoom + ctx.canvas.height / 2;

  // 2. Shrink it slightly so it stays "inside" the edge
  const innerSize = size * camera.zoom * 0.9; 
  
  // 3. Define the 6 corners of a hexagon (starting from top)
  const corners: {x: number, y: number}[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2; // -90 degrees is top
    corners.push({
      x: centerX + innerSize * Math.cos(angle),
      y: centerY + innerSize * Math.sin(angle)
    });
  }
  // Add the first corner at the end to close the loop for calculations
  corners.push(corners[0]);

  // 4. Drawing Setup
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, 4 * camera.zoom);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);

  // 5. Calculate how many sides to draw
  // progress * 6 gives us the current "side index" (e.g., 0.5 * 6 = 3 sides)
  const totalSides = 6;
  const currentProgress = Math.min(progress, 1) * totalSides;

  for (let i = 0; i < totalSides; i++) {
    const sideProgress = Math.max(0, Math.min(1, currentProgress - i));
    
    if (sideProgress <= 0) break;

    const start = corners[i];
    const end = corners[i + 1];

    // Interpolate between corners if the side is only partially finished
    const targetX = start.x + (end.x - start.x) * sideProgress;
    const targetY = start.y + (end.y - start.y) * sideProgress;

    ctx.lineTo(targetX, targetY);
  }

  ctx.stroke();
}*/

export function drawHex(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  size: number,
  baseColor: string,
  tileTerrain: string,
  owner: string | null,
  fillAlpha = FILL_ALPHA,
  isHovered = false
): Array<[number, number]> {

  const worldX = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const worldY = size * (3 / 2 * r);
  const renderSize = size * camera.zoom;

  const x = (worldX - camera.x) * camera.zoom + ctx.canvas.width / 2;
  const y = (worldY - camera.y) * camera.zoom + ctx.canvas.height / 2;
    
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    pts.push([
      x + renderSize * Math.cos(angle),
      y + renderSize * Math.sin(angle)
    ]);
  }

  // 3. TRACE OUTLINE PATH
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();

  if (!owner && !isHovered) {
    // 4. LAYER 1: DRAW BACKGROUND TEXTURES (Fixed Matrix Logic)
    let activePattern: CanvasPattern | null = null;
    // Make sure your extensions match your exact files! (.jpg for grass)
    if (tileTerrain === "GRASS" || tileTerrain === "G") activePattern = tileTextures.grass;
    if (tileTerrain === "DESERT" || tileTerrain === "D") activePattern = tileTextures.desert;
    if (tileTerrain === "MOUNTAIN" || tileTerrain === "M") activePattern = tileTextures.mountain;
    if (tileTerrain === "WATER" || tileTerrain === "W") activePattern = tileTextures.water;

    if (activePattern) {
      ctx.save();
      // 1. Shift canvas matrix to camera view space
      ctx.translate(-camera.x * camera.zoom + ctx.canvas.width / 2, -camera.y * camera.zoom + ctx.canvas.height / 2);
      
      // 2. Adjust pattern density! Lower numbers (like 0.25) shrink the texture detail down
      const patternDetailScale = 0.5; 
      ctx.scale(camera.zoom * patternDetailScale, camera.zoom * patternDetailScale);
      
      // 3. Since the context matrix is heavily scaled down, scale up the path points to compensate
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        // Divide by patternDetailScale to ensure the boundary matches the true hex edge
        ctx.lineTo(
          (worldX + size * Math.cos(angle)) / patternDetailScale, 
          (worldY + size * Math.sin(angle)) / patternDetailScale
        );
      }
      ctx.closePath();

      ctx.fillStyle = activePattern;
      ctx.fill();
      ctx.restore(); 
    } else {
      // Solid color fallbacks matching the brightened variants below
      ctx.save();
      if (tileTerrain === "DESERT" || tileTerrain === "D") ctx.fillStyle = "#e6b575";
      else if (tileTerrain === "MOUNTAIN" || tileTerrain === "M") ctx.fillStyle = "#525252"; // Updated color fallback
      else if (tileTerrain === "WATER" || tileTerrain === "W") ctx.fillStyle = "#1561b9";
      else ctx.fillStyle = "#58853e";
      ctx.fill();
      ctx.restore();
    }
  }

  // 5. LAYER 2: TEAM COLOR / HOVER HIGHLIGHT OVERLAY
  ctx.save();
  ctx.globalAlpha = fillAlpha;
  ctx.fillStyle = baseColor;
  ctx.fill();
  ctx.restore();

  // 6. LAYER 3: GRID OUTLINES
  ctx.lineWidth = Math.min(2, 2 / camera.zoom);
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.stroke();

  return pts;
}

export function drawHexStripes(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number]>
) {
  ctx.save();
  ctx.clip(); // uses current path
  ctx.fillStyle = getStripePattern(ctx)!;
  ctx.fillRect(
    pts[0][0] - 100,
    pts[0][1] - 100,
    200,
    200
  );
  ctx.restore();
}

export function getTileColor(args: {
  tile: TileState;
  hovered: boolean;
  state: any;
  playerId: PlayerId;
  isCutOff: boolean;
  connectedByPlayer: Map<PlayerId, Set<string>>;
}) {
  const { tile, hovered, state, playerId, isCutOff, connectedByPlayer } = args;

  let color = "#444";

  // ownership
  const owner =
  tile.ownerId ? state.players.get(tile.ownerId) : null;

  if (!owner) {
    color = "#33333377";;
  } else {
    color = owner.color;
  }

  // defense darkening
  if (tile.defense > 1) {
    if (owner)
      color = darken(owner.color, 0.6);
    else
      color = "#202020ff";
  }

  // cut-off visual (do NOT change hue)
  let fillAlpha = FILL_ALPHA;
  if (isCutOff) {
    fillAlpha = 0.18; // faded
  }

  if (tile.terrain === "BEDROCK") {
    color = "#111";     // very dark
    fillAlpha = 1;
  }

  // hover overrides everything
  if (args.hovered) {
    const ok = canCaptureClient(
      state,
      playerId,
      tile.q,
      tile.r,
      connectedByPlayer
    );

    color = ok ? "#6b7cff" : "rgba(216, 121, 121, 1)";
    fillAlpha = 0.45;
  }

  return { color, fillAlpha };
}

export function drawHexEffects(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  size: number,
  tile: TileState
) {
  const now = Date.now();
  const timeSinceLast = now - (tile.lastDefendedAt || 0);
  if(timeSinceLast > DEFENSE_HEAT_DECAY_MS) return 

  // 1. Calculate World/Screen position
  const worldX = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const worldY = size * (3 / 2 * r);
  const x = (worldX - camera.x) * camera.zoom + ctx.canvas.width / 2;
  const y = (worldY - camera.y) * camera.zoom + ctx.canvas.height / 2;
  const renderSize = size * camera.zoom;

  // === EFFECT 1: ATTACK COOLDOWN (The 1-second "Stun") ===
  if (timeSinceLast < 1000) {
    const p = 1 - (timeSinceLast / 1000); // 1.0 down to 0.0
    ctx.save();
    ctx.beginPath();
    // Draw hex shape for the highlight
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const px = x + renderSize * Math.cos(angle);
      const py = y + renderSize * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    
    // Bright white flash that fades out
    ctx.strokeStyle = `rgba(255, 255, 255, ${p * 0.8})`;
    ctx.lineWidth = 4 * camera.zoom;
    ctx.stroke();
    
    // Subtle inner "shield" fill
    ctx.fillStyle = `rgba(255, 255, 255, ${p * 0.2})`;
    ctx.fill();
    ctx.restore();
  }

  // === EFFECT 2: DEFENSE HEAT (The 10-second "Heat") ===
  if (timeSinceLast < DEFENSE_HEAT_DECAY_MS && tile.defenseHeat > 0) {
    const p = 1 - (timeSinceLast / DEFENSE_HEAT_DECAY_MS); // 1.0 down to 0.0
    const radius = renderSize * 0.76;
    
    ctx.save();
    // Use an orange-red glow based on heat intensity
    const heatColor = tile.defenseHeat >= 3 ? "#ec2d2d" : "#ec9150d7";
    
    ctx.setLineDash([4 * camera.zoom, 4 * camera.zoom]); // Dashed "unstable" look
    ctx.strokeStyle = heatColor;
    ctx.globalAlpha = p * 0.6; // Fades over 10s
    ctx.lineWidth = (1 + tile.defenseHeat) * camera.zoom; // Gets thicker with more heat
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawBuildingIcon(
  ctx: CanvasRenderingContext2D, 
  q: number, 
  r: number, 
  size: number, 
  type: BuildingType | "HQ",
  strokeColor: string 
) {
  const worldX = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const worldY = size * (3.5 / 2.333 * r);

  const x = (worldX - camera.x) * camera.zoom + ctx.canvas.width / 2;
  const y = (worldY - camera.y) * camera.zoom + ctx.canvas.height / 2;

  const s = size * camera.zoom * 0.35; 
  
  ctx.save();
  ctx.translate(x, y);
  
  // 1. DRAW FOUNDATION PAD (Creates contrast against the tile)
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; // Dark transparent shadow
  ctx.beginPath();
  // An ellipse that sits at the "bottom" of the building
  ctx.ellipse(0, s * 0.6, s * 1.2, s * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. SETUP BUILDING STYLES
  ctx.lineWidth = Math.max(1.5, 2 * camera.zoom);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  
  // High contrast: Bright white outline, very dark solid fill
  ctx.strokeStyle = "#ffffffb2"; 
  ctx.fillStyle = "rgba(20, 24, 28, 0.9)"; 

  ctx.beginPath();
  switch (type) {
    case "HOUSE":
      // Pitched roof house with a door and a round window
      // Outer shell
      ctx.moveTo(-s * 0.8, s * 0.8); ctx.lineTo(s * 0.8, s * 0.8);
      ctx.lineTo(s * 0.8, -s * 0.2); ctx.lineTo(0, -s * 0.8); 
      ctx.lineTo(-s * 0.8, -s * 0.2); ctx.closePath();
      // Door
      ctx.moveTo(-s * 0.25, s * 0.8); ctx.lineTo(-s * 0.25, s * 0.2);
      ctx.lineTo(s * 0.25, s * 0.2); ctx.lineTo(s * 0.25, s * 0.8);
      break;

    case "BARRACKS":
      // Crossed Swords (Universally recognizable for military)
      // Sword 1 (Top Left to Bottom Right)
      ctx.moveTo(-s * 0.7, -s * 0.7); ctx.lineTo(s * 0.7, s * 0.7); // Blade
      ctx.moveTo(-s * 0.7, -s * 0.7); ctx.lineTo(-s * 0.3, -s * 0.7); // Tip detail
      ctx.lineTo(-s * 0.7, -s * 0.3);
      ctx.moveTo(s * 0.4, s * 0.4); ctx.lineTo(s * 0.6, s * 0.2); // Crossguard
      // Sword 2 (Top Right to Bottom Left)
      ctx.moveTo(s * 0.7, -s * 0.7); ctx.lineTo(-s * 0.7, s * 0.7); // Blade
      ctx.moveTo(s * 0.7, -s * 0.7); ctx.lineTo(s * 0.3, -s * 0.7); // Tip detail
      ctx.lineTo(s * 0.7, -s * 0.3);
      ctx.moveTo(-s * 0.4, s * 0.4); ctx.lineTo(-s * 0.6, s * 0.2); // Crossguard
      break;

    case "FORT":
      // Heavy Castle with an arched doorway
      // Main walls
      ctx.moveTo(-s * 0.9, s * 0.9); ctx.lineTo(s * 0.9, s * 0.9);
      ctx.lineTo(s * 0.9, -s * 0.5);
      // Merlons (The teeth on top)
      ctx.lineTo(s * 0.5, -s * 0.5); ctx.lineTo(s * 0.5, -s * 0.2);
      ctx.lineTo(s * 0.2, -s * 0.2); ctx.lineTo(s * 0.2, -s * 0.5);
      ctx.lineTo(-s * 0.2, -s * 0.5); ctx.lineTo(-s * 0.2, -s * 0.2);
      ctx.lineTo(-s * 0.5, -s * 0.2); ctx.lineTo(-s * 0.5, -s * 0.5);
      ctx.lineTo(-s * 0.9, -s * 0.5); ctx.closePath();
      // Arched Portcullis/Doorway
      ctx.moveTo(-s * 0.3, s * 0.9); ctx.lineTo(-s * 0.3, s * 0.4);
      ctx.arc(0, s * 0.4, s * 0.3, Math.PI, 0); 
      ctx.lineTo(s * 0.3, s * 0.9);
      break;
    
    case "LABORATORY":
      // Outer Flask Hull
      ctx.moveTo(-s * 0.9, s * 0.8);  
      ctx.lineTo(s * 0.9, s * 0.8);   
      ctx.lineTo(s * 0.25, -s * 0.1);
      ctx.lineTo(s * 0.25, -s * 0.7); 
      ctx.lineTo(s * 0.4, -s * 0.7);  
      ctx.lineTo(s * 0.4, -s * 0.85);
      ctx.lineTo(-s * 0.4, -s * 0.85);
      ctx.lineTo(-s * 0.4, -s * 0.7); 
      ctx.lineTo(-s * 0.25, -s * 0.7)
      ctx.lineTo(-s * 0.25, -s * 0.1)
      ctx.closePath();
      break;

    case "HQ":
      // Majestic Crown
      ctx.moveTo(-s * 0.7, s * 0.8); ctx.lineTo(s * 0.7, s * 0.8); // Flat base
      ctx.lineTo(s * 0.9, -s * 0.5); // Right edge up
      ctx.lineTo(s * 0.4, -s * 0.1); // Inner right dip
      ctx.lineTo(0, -s * 0.9);       // Center tall spike
      ctx.lineTo(-s * 0.4, -s * 0.1); // Inner left dip
      ctx.lineTo(-s * 0.9, -s * 0.5); // Left edge up
      ctx.closePath();
      // Add jewels/rivets to the base of the crown
      ctx.moveTo(0, s * 0.5); ctx.arc(0, s * 0.5, s * 0.1, 0, Math.PI * 2);
      ctx.moveTo(-s * 0.4, s * 0.5); ctx.arc(-s * 0.4, s * 0.5, s * 0.08, 0, Math.PI * 2);
      ctx.moveTo(s * 0.4, s * 0.5); ctx.arc(s * 0.4, s * 0.5, s * 0.08, 0, Math.PI * 2);
      break;
  }

  // 3. RENDER THE BUILDING
  ctx.fill();   // Fills with the dark color
  ctx.stroke(); // Draws the white outline
  
  ctx.restore();
}

/** */
const visualProgressMap = new Map<string, number>();
export function drawCaptureHex(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  size: number,
  serverProgress: number, // Rename this to clarify it's the "target"
  color: string,
  deltaTime: number
) {
  const tileKey = `${q},${r}`;
  
  // 1. Get the last "smooth" value we drew
  let visualProgress = visualProgressMap.get(tileKey) ?? 0;
  if (serverProgress === 0 || visualProgress > serverProgress) visualProgress = 0;

  // 2. The chase
  const lerpSpeed = 10 * deltaTime; 
  visualProgress += (serverProgress - visualProgress) * lerpSpeed;
  
  // Save the new smooth value for the next frame
  visualProgressMap.set(tileKey, visualProgress);

  const worldX = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const worldY = size * (3 / 2 * r);
  const centerX = (worldX - camera.x) * camera.zoom + ctx.canvas.width / 2;
  const centerY = (worldY - camera.y) * camera.zoom + ctx.canvas.height / 2;

  const innerSize = size * camera.zoom * 0.9; 
  
  const corners: {x: number, y: number}[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    corners.push({
      x: centerX + innerSize * Math.cos(angle),
      y: centerY + innerSize * Math.sin(angle)
    });
  }
  corners.push(corners[0]);

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, 4 * camera.zoom);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);

  // USE visualProgress HERE
  const totalSides = 6;
  const currentProgress = Math.min(visualProgress, 1) * totalSides;

  for (let i = 0; i < totalSides; i++) {
    const sideProgress = Math.max(0, Math.min(1, currentProgress - i));
    if (sideProgress <= 0) break;

    const start = corners[i];
    const end = corners[i + 1];
    const targetX = start.x + (end.x - start.x) * sideProgress;
    const targetY = start.y + (end.y - start.y) * sideProgress;

    ctx.lineTo(targetX, targetY);
  }

  ctx.stroke();
}
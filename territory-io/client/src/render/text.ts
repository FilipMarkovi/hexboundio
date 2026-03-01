import { camera } from "./camera"

export function drawHexText(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  size: number,
  text: string,
  hasBuilding: boolean // New parameter
) {
  // 1. Calculate world position
  const worldX = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const worldY = size * (3 / 2 * r);

  // 2. Camera transform
  const centerX = (worldX - camera.x) * camera.zoom + ctx.canvas.width / 2;
  const centerY = (worldY - camera.y) * camera.zoom + ctx.canvas.height / 2;

  // 3. Calculate Offset
  // If there's a building, move it up by ~40% of the hex size
  const offset = hasBuilding ? (size * camera.zoom * 0.5) : 0;
  const y = centerY - offset;

  // 4. Render
  ctx.save();
  ctx.fillStyle = "#aaa"
  ctx.font = `${12 * camera.zoom}px monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  
  // Optional: Add a tiny dark glow so numbers are readable over any background
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;
  
  ctx.fillText(text, centerX, y);
  ctx.restore();
}
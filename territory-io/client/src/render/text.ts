import { camera } from "./camera"

export function drawHexText(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  size: number,
  text: string
) {
  // world position
  const worldX = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r)
  const worldY = size * (3 / 2 * r)

  // camera transform (EXACTLY like drawHex)
  const x =
    (worldX - camera.x) * camera.zoom + ctx.canvas.width / 2
  const y =
    (worldY - camera.y) * camera.zoom + ctx.canvas.height / 2

  ctx.fillStyle = "#aaa"
  ctx.font = `${12 * camera.zoom}px monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, x, y)
}

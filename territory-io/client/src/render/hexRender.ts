
import type { TileState, PlayerId } from "../../../shared";
import { canCaptureClient } from "../utils/canCapture";
import { camera } from "./camera";
import { getStripePattern } from "./patterns";
import { FILL_ALPHA } from "../constants";
import { darken, withAlpha } from "./playerColors";
export function drawCaptureRing(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  size: number,
  progress: number,
  color: string
) {
  // world position (EXACT SAME AS drawHex)
  const worldX = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const worldY = size * (3 / 2 * r);

  // camera transform (EXACT SAME AS drawHex)
  const x =
    (worldX - camera.x) * camera.zoom + ctx.canvas.width / 2;
  const y =
    (worldY - camera.y) * camera.zoom + ctx.canvas.height / 2;

  const radius = size * camera.zoom * 0.9 *0.7;
  const start = -Math.PI / 2;
  const end = start + Math.min(progress, 1) * Math.PI * 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, 3 * camera.zoom);
  ctx.beginPath();
  ctx.arc(x, y, radius, start, end);
  ctx.stroke();
}


export function drawHex(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  size: number,
  baseColor: string,
  fillAlpha = FILL_ALPHA
): Array<[number, number]> {
  // world position
  const worldX = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
  const worldY = size * (3 / 2 * r);
  const renderSize = size * camera.zoom;

  // camera transform
  const x =
    (worldX - camera.x) * camera.zoom + ctx.canvas.width / 2;
  const y =
    (worldY - camera.y) * camera.zoom + ctx.canvas.height / 2;
    
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6; // rotated for pointy-top
    pts.push([
      x + renderSize * Math.cos(angle),
      y + renderSize * Math.sin(angle)
    ]);
  }

  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();

  ctx.save();
  ctx.globalAlpha = fillAlpha;
  ctx.fillStyle = baseColor;
  ctx.fill();
  ctx.restore();

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
    color = "#333";
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

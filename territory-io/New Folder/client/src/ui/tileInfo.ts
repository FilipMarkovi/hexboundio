import type { CoreGameState, TileState } from "../../../shared";


export function drawTileInfo(
  ctx: CanvasRenderingContext2D,
  tile: TileState,
  state: CoreGameState,
  me: string
) {
  const paddingX = 14;
  const paddingTop = 22;   // 🔑 EXTRA TOP SPACE FOR ROUNDED CORNER
  const paddingBottom = 14;
  const lineHeight = 18;
  const width = 240;
  const radius = 10;

  const x = ctx.canvas.width - width - 20;
  const y = 20;

  const lines: { text: string; color?: string }[] = [];

  const terrainColor =
    tile.terrain === "ROCK" ? "#9ca3af" :
    tile.terrain === "MOUNTAIN" ? "#d1d5db" :
    "#6ee7b7";

  let ownerText = "Neutral";
  let ownerColor = "#9ca3af";

  if (tile.ownerId === me) {
    ownerText = "You";
    ownerColor = "#60a5fa";
  } else if (tile.ownerId) {
    const owner = state.players.get(tile.ownerId);
    ownerText = owner?.username ?? "Unknown";
    ownerColor = "#f87171";
  }

  lines.push({ text: `Terrain: ${tile.terrain}`, color: terrainColor });
  lines.push({ text: `Owner: ${ownerText}`, color: ownerColor });

  if (tile.building) {
    lines.push({ text: `Building: ${tile.building}`, color: "#facc15" });
  }

  lines.push({ text: `Base defense: ${tile.baseDefense}` });
  lines.push({ text: `Total defense: ${tile.defense}`, color: "#f97316" });

  const height =
    paddingTop +
    paddingBottom +
    lines.length * lineHeight;

  // text
  ctx.font = "14px system-ui, sans-serif";
  ctx.textBaseline = "top";

  let ty = y + paddingTop;
  for (const line of lines) {
    ctx.fillStyle = line.color ?? "#e5e7eb";
    ctx.fillText(line.text, x + paddingX, ty);
    ty += lineHeight;
  }
}

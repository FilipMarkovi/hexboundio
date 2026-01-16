
import { clientNetState } from "../state/clientState";
import { clientUIState } from "../state/clientState";

export function drawHUD(ctx: CanvasRenderingContext2D) {
  ctx.font = "16px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const state = clientNetState.state;
  const me = clientNetState.playerId
    ? state?.players.get(clientNetState.playerId)
    : null;

  if (!state || !me) {
    ctx.fillStyle = "#fff";
    ctx.fillText(
      `Waiting: ${clientNetState.lobby.connected}/${clientNetState.lobby.required}`,
      12,
      12
    );
    return;
  }

  // === PLAYER NAME (COLORED) ===
  ctx.fillStyle = me.color;
  ctx.fillText(`Player: ${me.username}`, 12, 12);

  // === STATS ===
  ctx.fillStyle = "#fff";
  ctx.fillText(`Army: ${me.army.toFixed(1)}`, 12, 32);
  ctx.fillText(`Gold: ${me.gold.toFixed(1)}`, 12, 52);

  // === GAME OVER ===
  if (state.gameOver) {
    ctx.fillStyle = "#f87171";
    ctx.fillText(`Game Over`, 12, 80);
    ctx.fillStyle = "#fff";
    ctx.fillText(`Winner: ${state.gameOver.winner}`, 12, 100);
  }
}



export function drawBuildMode(ctx: CanvasRenderingContext2D) {
  if (!clientUIState.selectedBuilding) return;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, ctx.canvas.width, 30);

  ctx.fillStyle = "#fff";
  ctx.font = "16px sans-serif";
  ctx.fillText(
    `Build Mode: ${clientUIState.selectedBuilding}`,
    10,
    20
  );
}
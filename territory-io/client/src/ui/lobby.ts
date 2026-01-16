import { clientNetState, clientUIState } from "../state/clientState";

let root: HTMLDivElement | null = null;

export function initLobbyUI(sendIntent: (intent: any) => void) {
  root = document.createElement("div");
  root.style.position = "absolute";
  root.style.inset = "0";
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.alignItems = "center";
  root.style.justifyContent = "center";
  root.style.gap = "12px";
  root.style.background = "rgba(0,0,0,0.65)";
  root.style.color = "white";
  root.style.zIndex = "50";

  root.innerHTML = `
    <div style="font: 700 28px system-ui;">Hex Game</div>
    <input id="name" placeholder="username"
      style="padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:#0f172a;color:white;min-width:240px;" />
    <button id="play"
      style="padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:#1f2937;color:white;cursor:pointer;min-width:240px;">
      Play
    </button>
    <div id="status" style="opacity:0.9;font: 14px system-ui;"></div>
  `;

  document.body.appendChild(root);

  const btn = root.querySelector("#play") as HTMLButtonElement;
  const input = root.querySelector("#name") as HTMLInputElement;
  const status = root.querySelector("#status") as HTMLDivElement;

  btn.onclick = () => {
    const name = input.value.trim();
    if (!name) return;
    clientUIState.username = name;
    clientUIState.phase = "QUEUED";
    btn.disabled = true;
    btn.style.opacity = "0.6";
    btn.style.cursor = "default";
    sendIntent({ type: "JOIN_QUEUE", username: name });
    status.textContent = "Queued…";
  };
}

export function updateLobbyUI() {
  if (!root) return;

  root.style.display = clientUIState.phase === "PLAYING" ? "none" : "flex";

  const status = root.querySelector("#status") as HTMLDivElement;
  const btn = root.querySelector("#play") as HTMLButtonElement;
  const lobby = clientNetState.lobby;
  const state = clientNetState.state;

  if (!lobby) {
    status.textContent = "Connecting…";
    btn.disabled = true;
    return;
  }

  //  Match running → disable play
  if (state?.started && !state.gameOver) {
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";
    status.textContent = "Match in progress. Please wait.";
    return;
  }

  // Match ended or not started
  btn.disabled = clientUIState.phase === "QUEUED";
  btn.style.opacity = btn.disabled ? "0.6" : "1";
  btn.style.cursor = btn.disabled ? "default" : "pointer";

  if (clientUIState.phase === "QUEUED") {
    status.textContent = `Waiting for players: ${lobby.connected}/${lobby.required}`;
  } else {
    status.textContent = `Lobby: ${lobby.connected}/${lobby.required} queued`;
  }
}

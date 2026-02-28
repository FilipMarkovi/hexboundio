import { clientNetState, clientUIState } from "../state/clientState";

let lobbyRoot: HTMLDivElement;
let returnRoot: HTMLDivElement;

let playBtn: HTMLButtonElement;
let inputEl: HTMLInputElement;
let statusEl: HTMLDivElement;

export function initLobbyUI(sendIntent: (intent: any) => void) {
  /* ================= LOBBY OVERLAY ================= */
  lobbyRoot = document.createElement("div");
  lobbyRoot.style.position = "absolute";
  lobbyRoot.style.inset = "0";
  lobbyRoot.style.display = "flex";
  lobbyRoot.style.flexDirection = "column";
  lobbyRoot.style.alignItems = "center";
  lobbyRoot.style.justifyContent = "center";
  lobbyRoot.style.gap = "12px";
  lobbyRoot.style.background = "rgba(0,0,0,0.7)";
  lobbyRoot.style.color = "white";
  lobbyRoot.style.zIndex = "50";

  lobbyRoot.innerHTML = `
    <div style="font:700 28px system-ui;">Hex Game</div>

    <input id="name"
      placeholder="username"
      style="padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:#0f172a;color:white;min-width:240px;" />

    <button id="play"
      style="padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:#1f2937;color:white;cursor:pointer;min-width:240px;">
    </button>

    <div id="status" style="opacity:0.9;font:14px system-ui;"></div>
  `;

  document.body.appendChild(lobbyRoot);

  playBtn = lobbyRoot.querySelector("#play")!;
  playBtn.textContent = "Play"
  inputEl = lobbyRoot.querySelector("#name")!;
  inputEl.maxLength=15
  if (inputEl.value === "") {
    const randomId = Math.floor(10000 + Math.random() * 90000);
    inputEl.value = `Player_${randomId}`;
  }
  statusEl = lobbyRoot.querySelector("#status")!;

  playBtn.onclick = () => {
    const name = inputEl.value.trim();
    if (!name) return;

    clientUIState.username = name;
    clientUIState.phase = "QUEUED";

    playBtn.disabled = true;
    inputEl.disabled = true
    playBtn.style.opacity = "0.6";

    sendIntent({ type: "JOIN_QUEUE", username: name });
  };

  /* ================= RETURN BUTTON ================= */
  returnRoot = document.createElement("div");
  returnRoot.style.position = "absolute";
  returnRoot.style.left = "50%";
  returnRoot.style.top = "20%"; // 👈 slightly above center
  returnRoot.style.transform = "translate(-50%, -50%)";
  returnRoot.style.zIndex = "40";
  returnRoot.style.display = "none";

  const btn = document.createElement("button");
  btn.textContent = "Return to Lobby";
  btn.style.padding = "8px 12px";
  btn.style.borderRadius = "8px";
  btn.style.border = "1px solid rgba(255,255,255,0.2)";
  btn.style.background = "rgba(0,0,0,0.6)";
  btn.style.color = "white";
  btn.style.cursor = "pointer";

  btn.onclick = () => {
    sendIntent({ type: "RETURN_LOBBY"});
    clientNetState.state = null;
    clientUIState.phase = "LOBBY";
    clientUIState.selectedBuilding = null;
    returnRoot.style.display = "none";
  };

  returnRoot.appendChild(btn);
  document.body.appendChild(returnRoot);
}

export function updateLobbyUI() {
  const state = clientNetState.state;
  const lobby = clientNetState.lobby;

  /* ===== LOBBY OVERLAY ===== */
lobbyRoot.style.display =
  !state?.gameOver &&
  (clientUIState.phase === "LOBBY" || clientUIState.phase === "QUEUED")
    ? "flex"
    : "none";

  if (!lobby) {
    statusEl.textContent = "Connecting…";
    return;
  }

  if (clientUIState.phase === "QUEUED") {
    statusEl.textContent = `Waiting for players: ${lobby.connected}/${lobby.required}`;
  } else {
    statusEl.textContent = `Lobby: ${lobby.connected}/${lobby.required}`;
    playBtn.disabled = false;
    inputEl.disabled = false
    playBtn.style.opacity = "1";
  }

  /* ===== RETURN BUTTON ===== */
  if (state?.gameOver || state?.players.get(String(clientNetState.playerId))?.eliminated === true) {
    returnRoot.style.display = "block";
  } else {
    returnRoot.style.display = "none";
  }
}

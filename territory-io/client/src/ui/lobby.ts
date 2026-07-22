import { ROOM_CODE_LENGTH } from "../constants/index.js";
import { clientNetState, clientUIState } from "../state/clientState.js";
import { loginWithGoogle, supabase } from "../utils/db.js"; 

let topBarRoot: HTMLDivElement;
let lobbyRoot: HTMLDivElement;
let returnRoot: HTMLDivElement;
let loadingScreenRoot: HTMLDivElement; // Track the loading overlay

let playBtn: HTMLButtonElement;
let inputEl: HTMLInputElement;
let statusEl: HTMLDivElement;

// Elements in the new Top Bar
let topBarAuthContainer: HTMLDivElement;

let isUserAuthenticated = false;

/* ================= PRIVATE LOBBY STATE & UI ================= */
type PrivateViewMode = "MAIN" | "CREATE_PRIVATE" | "JOIN_PRIVATE" | "IN_PRIVATE_LOBBY";
let currentPrivateView: PrivateViewMode = "MAIN";

// UI Panels
let mainButtonsContainer: HTMLDivElement;
let createPrivateContainer: HTMLDivElement;
let joinPrivateContainer: HTMLDivElement;
let inPrivateLobbyContainer: HTMLDivElement;

// Form & Controls
let fillBotsCheckbox: HTMLInputElement;
let maxPlayersInput: HTMLInputElement;
let roomCodeInput: HTMLInputElement;
let roomCodeDisplay: HTMLHeadingElement;
let copyCodeBtn: HTMLButtonElement;
let privatePlayerListEl: HTMLUListElement;
let privateSettingsDisplayEl: HTMLDivElement;
let startPrivateMatchBtn: HTMLButtonElement;
let privateErrorEl: HTMLDivElement;

export function initLobbyUI(sendIntent: (intent: any) => void) {
  /* ================= INTRO LOADING SCREEN ================= */
  loadingScreenRoot = document.createElement("div");
  loadingScreenRoot.style.position = "absolute";
  loadingScreenRoot.style.inset = "0";
  loadingScreenRoot.style.background = "#000000";
  loadingScreenRoot.style.color = "white";
  loadingScreenRoot.style.display = "flex";
  loadingScreenRoot.style.alignItems = "center";
  loadingScreenRoot.style.justifyContent = "center";
  loadingScreenRoot.style.zIndex = "100"; 
  loadingScreenRoot.style.transition = "opacity 1.0s ease"; 
  loadingScreenRoot.style.opacity = "1";

  loadingScreenRoot.innerHTML = `
    <div style="font:700 64px system-ui; letter-spacing: 2px; text-transform: uppercase;">Age of Hexes</div>
  `;
  document.body.appendChild(loadingScreenRoot);

  setTimeout(() => {
    loadingScreenRoot.style.opacity = "0";
    setTimeout(() => {
      loadingScreenRoot.remove();
    }, 1000);
  }, 1000);

  /* ================= TOP BAR ================= */
  topBarRoot = document.createElement("div");
  topBarRoot.style.position = "absolute";
  topBarRoot.style.top = "0";
  topBarRoot.style.left = "0";
  topBarRoot.style.width = "100%";
  topBarRoot.style.height = "50px";
  topBarRoot.style.display = "flex";
  topBarRoot.style.alignItems = "center";
  topBarRoot.style.justifyContent = "space-between";
  topBarRoot.style.padding = "0 20px";
  topBarRoot.style.background = "rgba(15, 23, 42, 0.8)";
  topBarRoot.style.backdropFilter = "blur(8px)";
  topBarRoot.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";
  topBarRoot.style.color = "white";
  topBarRoot.style.zIndex = "60";
  topBarRoot.style.boxSizing = "border-box";

  topBarRoot.innerHTML = `
    <div style="font:700 18px system-ui; letter-spacing: 0.5px;">AgeOfHexes.io</div>
    <div id="top-bar-auth" style="position: relative;"></div>
  `;

  document.body.appendChild(topBarRoot);
  topBarAuthContainer = topBarRoot.querySelector("#top-bar-auth")!;

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
    <div style="font:700 36px system-ui; margin-bottom: 4px;">Play AgeOfHexes</div>

    <input id="name"
      placeholder="username"
      style="padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:#0f172a;color:white;min-width:260px;text-align:center;font-weight:600;" />

    <!-- VIEW 1: MAIN LOBBY BUTTONS -->
    <div id="main-lobby-view" style="display:flex; flex-direction:column; gap:8px; width:260px;">
      <button id="play"
        style="padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:#2563eb;color:white;cursor:pointer;width:100%;font-weight:600;font-size:15px;">
        Quick Play
      </button>

      <div style="display:flex; gap:8px;">
        <button id="btn-show-create"
          style="flex:1; padding:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:#1e293b; color:white; cursor:pointer; font-weight:600; font-size:12px;">
          Host Room
        </button>
        <button id="btn-show-join"
          style="flex:1; padding:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:#1e293b; color:white; cursor:pointer; font-weight:600; font-size:12px;">
          Join Code
        </button>
      </div>
    </div>

    <!-- VIEW 2: CREATE PRIVATE ROOM SETTINGS -->
    <div id="create-private-view" style="display:none; flex-direction:column; gap:10px; width:260px; background:#0f172a; padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
      <div style="font:600 16px system-ui; text-align:center;">Host Private Room</div>
      
      <label style="display:flex; align-items:center; justify-content:space-between; font:13px system-ui; color:#cbd5e1;">
        Max Players (2-8):
        <input type="number" id="input-max-players" value="4" min="2" max="8" 
          style="width:50px; padding:4px 6px; border-radius:6px; border:1px solid rgba(255,255,255,0.2); background:#1e293b; color:white; text-align:center; font-weight:600;" />
      </label>

      <label style="display:flex; align-items:center; gap:8px; font:13px system-ui; cursor:pointer;">
        <input type="checkbox" id="chk-fill-bots" checked style="cursor:pointer;" />
        Fill empty slots with bots
      </label>

      <button id="btn-confirm-create"
        style="padding:9px; border-radius:8px; border:none; background:#16a34a; color:white; cursor:pointer; font-weight:600; font-size:13px;">
        Create Room
      </button>
      <button id="btn-cancel-create"
        style="padding:6px; border-radius:8px; border:none; background:transparent; color:#94a3b8; cursor:pointer; font:12px system-ui;">
        Cancel
      </button>
    </div>

    <!-- VIEW 3: JOIN PRIVATE ROOM INPUT -->
    <div id="join-private-view" style="display:none; flex-direction:column; gap:10px; width:260px; background:#0f172a; padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
      <div style="font:600 16px system-ui; text-align:center;">Join Private Room</div>

      <input id="input-room-code"
        placeholder="${ROOM_CODE_LENGTH}-LETTER CODE"
        maxlength="${ROOM_CODE_LENGTH}"
        style="padding:8px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:#1e293b; color:white; text-align:center; font:700 16px monospace; text-transform:uppercase; letter-spacing:2px;" />

      <button id="btn-confirm-join"
        style="padding:9px; border-radius:8px; border:none; background:#2563eb; color:white; cursor:pointer; font-weight:600; font-size:13px;">
        Join Room
      </button>
      <button id="btn-cancel-join"
        style="padding:6px; border-radius:8px; border:none; background:transparent; color:#94a3b8; cursor:pointer; font:12px system-ui;">
        Cancel
      </button>
    </div>

    <!-- VIEW 4: IN PRIVATE LOBBY WAITING ROOM -->
    <div id="in-private-view" style="display:none; flex-direction:column; gap:12px; width:280px; background:#0f172a; padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
      <div style="text-align:center;">
        <div style="font:500 12px system-ui; color:#94a3b8; letter-spacing:1px; text-transform:uppercase;">Room Code</div>
        <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:2px;">
          <h2 id="display-room-code" style="font:700 24px monospace; letter-spacing:3px; margin:0; color:#38bdf8;">${"-".repeat(ROOM_CODE_LENGTH)}</h2>
          <button id="btn-copy-code" title="Copy Code" style="background:rgba(255,255,255,0.1); border:none; border-radius:6px; color:white; padding:4px 8px; cursor:pointer;">📋</button>
        </div>
      </div>

      <div id="private-settings-display" style="font:12px system-ui; color:#cbd5e1; background:rgba(255,255,255,0.05); padding:8px 10px; border-radius:6px; text-align:center;">
        Bots: Auto-Fill
      </div>

      <div style="width:100%;">
        <div style="font:600 13px system-ui; color:#94a3b8; margin-bottom:6px;">Players</div>
        <ul id="private-player-list" style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto;">
        </ul>
      </div>

      <button id="btn-start-private-match"
        style="padding:10px; border-radius:8px; border:none; background:#16a34a; color:white; cursor:pointer; font-weight:600; font-size:14px; display:none;">
        Start Game
      </button>

      <button id="btn-leave-private"
        style="padding:8px; border-radius:8px; border:1px solid rgba(239, 68, 68, 0.4); background:rgba(239, 68, 68, 0.1); color:#fca5a5; cursor:pointer; font-weight:600; font-size:12px;">
        Leave Room
      </button>
    </div>

    <!-- ERROR TEXT -->
    <div id="private-error-msg" style="color:#f87171; font:12px system-ui; display:none; text-align:center; max-width:260px;"></div>

    <div id="status" style="opacity:0.9;font:14px system-ui;margin-top:4px;"></div>
  `;

  document.body.appendChild(lobbyRoot);

  // References
  playBtn = lobbyRoot.querySelector("#play")!;
  inputEl = lobbyRoot.querySelector("#name")!;
  inputEl.maxLength = 15;
  statusEl = lobbyRoot.querySelector("#status")!;

  mainButtonsContainer = lobbyRoot.querySelector("#main-lobby-view")!;
  createPrivateContainer = lobbyRoot.querySelector("#create-private-view")!;
  joinPrivateContainer = lobbyRoot.querySelector("#join-private-view")!;
  inPrivateLobbyContainer = lobbyRoot.querySelector("#in-private-view")!;

  fillBotsCheckbox = lobbyRoot.querySelector("#chk-fill-bots")!;
  maxPlayersInput = lobbyRoot.querySelector("#input-max-players")!;
  roomCodeInput = lobbyRoot.querySelector("#input-room-code")!;
  roomCodeDisplay = lobbyRoot.querySelector("#display-room-code")!;
  copyCodeBtn = lobbyRoot.querySelector("#btn-copy-code")!;
  privatePlayerListEl = lobbyRoot.querySelector("#private-player-list")!;
  privateSettingsDisplayEl = lobbyRoot.querySelector("#private-settings-display")!;
  startPrivateMatchBtn = lobbyRoot.querySelector("#btn-start-private-match")!;
  privateErrorEl = lobbyRoot.querySelector("#private-error-msg")!;

  setupAuthAndUsername();

  /* ================= BUTTON EVENT LISTENERS ================= */

  // Quick Play
  playBtn.onclick = () => {
    const name = getValidName();
    if (!name) return;

    clientUIState.username = name;
    clientUIState.phase = "QUEUED";

    playBtn.disabled = true;
    inputEl.disabled = true;
    playBtn.style.opacity = "0.6";

    sendIntent({ type: "JOIN_QUEUE", username: name });
  };

  // View Switchers
  lobbyRoot.querySelector("#btn-show-create")!.addEventListener("click", () => setPrivateView("CREATE_PRIVATE"));
  lobbyRoot.querySelector("#btn-show-join")!.addEventListener("click", () => setPrivateView("JOIN_PRIVATE"));
  lobbyRoot.querySelector("#btn-cancel-create")!.addEventListener("click", () => setPrivateView("MAIN"));
  lobbyRoot.querySelector("#btn-cancel-join")!.addEventListener("click", () => setPrivateView("MAIN"));


  // Create Private Room Action
  lobbyRoot.querySelector("#btn-confirm-create")!.addEventListener("click", () => {
    const name = getValidName();
    if (!name) return;

    let maxPlayers = parseInt(maxPlayersInput.value, 10);
    if (isNaN(maxPlayers) || maxPlayers < 2) maxPlayers = 2;
    if (maxPlayers > 8) maxPlayers = 8;

    hideError();
    clientUIState.username = name;

    sendIntent({
      type: "CREATE_PRIVATE_ROOM",
      username: name,
      fillWithBots: fillBotsCheckbox.checked,
      maxPlayers: maxPlayers
    });
  });

  // Join Private Room Action
  lobbyRoot.querySelector("#btn-confirm-join")!.addEventListener("click", () => {
    const name = getValidName();
    const code = roomCodeInput.value.trim().toUpperCase();

    if (!name) return;
    if (code.length !== ROOM_CODE_LENGTH) {
      showError(`Code must be ${ROOM_CODE_LENGTH} characters.`);
      return;
    }

    hideError();
    clientUIState.username = name;

    sendIntent({
      type: "JOIN_PRIVATE_ROOM",
      username: name,
      code: code
    });
  });

  // Copy Room Code
  copyCodeBtn.onclick = () => {
    const code = roomCodeDisplay.textContent;
    if (code && code !== "-".repeat(ROOM_CODE_LENGTH)) {
      navigator.clipboard.writeText(code);
      copyCodeBtn.textContent = "✅";
      setTimeout(() => { copyCodeBtn.textContent = "📋"; }, 1500);
    }
  };

  // Start Match (Host manually starts)
  startPrivateMatchBtn.onclick = () => {
    sendIntent({ type: "START_PRIVATE_MATCH" });
  };

  // Leave Room
  lobbyRoot.querySelector("#btn-leave-private")!.addEventListener("click", () => {
    sendIntent({ type: "LEAVE_PRIVATE_ROOM" });
    setPrivateView("MAIN");
  });

  /* ================= RETURN BUTTON ================= */
  returnRoot = document.createElement("div");
  returnRoot.style.position = "absolute";
  returnRoot.style.left = "50%";
  returnRoot.style.top = "20%"; 
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
    setPrivateView("MAIN");
    returnRoot.style.display = "none";
  };

  returnRoot.appendChild(btn);
  document.body.appendChild(returnRoot);

  window.addEventListener("click", (e) => {
    const dropdown = document.getElementById("auth-dropdown");
    if (dropdown && !topBarAuthContainer.contains(e.target as Node)) {
      dropdown.style.display = "none";
    }
  });
}

/* ================= HELPER FUNCTIONS ================= */

function getValidName(): string | null {
  const name = inputEl.value.trim();
  if (!name) {
    showError("Please enter a username.");
    return null;
  }
  return name;
}

function setPrivateView(view: PrivateViewMode) {
  currentPrivateView = view;
  hideError();

  mainButtonsContainer.style.display = view === "MAIN" ? "flex" : "none";
  createPrivateContainer.style.display = view === "CREATE_PRIVATE" ? "flex" : "none";
  joinPrivateContainer.style.display = view === "JOIN_PRIVATE" ? "flex" : "none";
  inPrivateLobbyContainer.style.display = view === "IN_PRIVATE_LOBBY" ? "flex" : "none";
}

export function showError(msg: string) {
  privateErrorEl.textContent = msg;
  privateErrorEl.style.display = "block";
}

export function hideError() {
  privateErrorEl.style.display = "none";
  privateErrorEl.textContent = "";
}

/**
 * Handles checking active user sessions and fetching the custom profile name
 * from the database, falling back to a guest name if unauthenticated.
 */
async function setupAuthAndUsername() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session && session.user) {
    try {
      const { data: profile } = await supabase
        .from("players")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile && profile.username) {
        inputEl.value = profile.username;
      } else {
        const randomId = Math.floor(1000000 + Math.random() * 9000000);
        inputEl.value = `Player_${randomId}`;
      }
    } catch (e) {
      const randomId = Math.floor(1000000 + Math.random() * 9000000);
      inputEl.value = `Player_${randomId}`;
    }

    isUserAuthenticated = true;
    inputEl.disabled = true;
    inputEl.style.opacity = "0.8";
    inputEl.style.cursor = "default";

    topBarAuthContainer.innerHTML = `
      <button id="user-menu-trigger" style="background:none; border:none; color:#38bdf8; font:600 14px system-ui; cursor:pointer; display:flex; align-items:center; gap:4px; padding:4px 8px;">
        ${inputEl.value} ▾
      </button>
      <div id="auth-dropdown" style="display:none; position:absolute; right:0; top:calc(100% + 8px); background:#1e293b; border:1px solid rgba(255,255,255,0.1); border-radius:6px; min-width:120px; box-shadow:0 4px 12px rgba(0,0,0,0.5); overflow:hidden;">
        <button id="logout-btn" style="width:100%; text-align:left; background:none; border:none; color:#ef4444; font:500 13px system-ui; padding:10px 12px; cursor:pointer; transition:background 0.2s;">
          Log Out
        </button>
      </div>
    `;

    const trigger = topBarAuthContainer.querySelector("#user-menu-trigger")! as HTMLButtonElement;
    const dropdown = topBarAuthContainer.querySelector("#auth-dropdown")! as HTMLDivElement;
    const logoutBtn = topBarAuthContainer.querySelector("#logout-btn")! as HTMLButtonElement;

    trigger.onclick = (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    };

    logoutBtn.onmouseenter = () => logoutBtn.style.background = "rgba(239, 68, 68, 0.1)";
    logoutBtn.onmouseleave = () => logoutBtn.style.background = "none";

    logoutBtn.onclick = async () => {
      await supabase.auth.signOut();
      setupAuthAndUsername();
    };

  } else {
    const randomId = Math.floor(1000000 + Math.random() * 9000000);
    inputEl.value = `Player_${randomId}`;
    isUserAuthenticated = false;
    inputEl.disabled = false;
    inputEl.style.opacity = "1";
    inputEl.style.cursor = "text";

    topBarAuthContainer.innerHTML = `
      <button id="top-google-login"
        style="padding:6px 12px;border-radius:8px;border:none;background:#4285F4;color:white;cursor:pointer;font:600 13px system-ui;display:flex;align-items:center;gap:6px;transition: background 0.2s;">
        <svg width="14" height="14" viewBox="0 0 18 18" style="display:block;">
          <path fill="#FFF" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.56 2.69-3.86 2.69-6.6z" />
          <path fill="#FFF" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.91-2.26c-.8.54-1.85.86-3.05.86-2.34 0-4.33-1.58-5.04-3.7H.94v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FFF" d="M3.96 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.94a9 9 0 0 0 0 8.06l3.02-2.33z" />
          <path fill="#FFF" d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.1A9 9 0 0 0 .94 4.97l3.02 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
        </svg>
        Sign in with Google
      </button>
    `;

    const topGoogleBtn = topBarAuthContainer.querySelector("#top-google-login")! as HTMLButtonElement;
    topGoogleBtn.onclick = () => {
      loginWithGoogle();
    };
  }
}

export function updateLobbyUI() {
  const state = clientNetState.state;
  const lobby = clientNetState.lobby;

  const showTopBar = clientUIState.phase === "LOBBY" || clientUIState.phase === "QUEUED";
  topBarRoot.style.display = showTopBar ? "flex" : "none";

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

  // Handle standard public queue text
  if (currentPrivateView !== "IN_PRIVATE_LOBBY") {
    if (clientUIState.phase === "QUEUED") {
      statusEl.textContent = `Waiting for players: ${lobby.connected}/${lobby.required}`;
    } else {
      statusEl.textContent = `Lobby: ${lobby.connected}/${lobby.required}`;
      inputEl.disabled = isUserAuthenticated;
      playBtn.disabled = false;
      playBtn.style.opacity = "1";
    }
  } else {
    statusEl.textContent = ""; // Clear standard status text in private room view
  }

  /* ===== RETURN BUTTON ===== */
  if (state?.gameOver || state?.players.get(String(clientNetState.playerId))?.eliminated === true) {
    returnRoot.style.display = "block";
  } else {
    returnRoot.style.display = "none";
  }
}

/**
 * Call this function whenever a "PRIVATE_LOBBY" broadcast message arrives over WebSocket.
 */
export function handlePrivateLobbyUpdate(msg: {
  code: string;
  connected: number;
  required: number;
  players: Array<{ username: string }>;
  isHost?: boolean;
}) {
  setPrivateView("IN_PRIVATE_LOBBY");

  // Update Code & Counter
  roomCodeDisplay.textContent = msg.code;

  // Render Roster
  privatePlayerListEl.innerHTML = msg.players
    .map(
      (p) => `
      <li style="font:500 13px system-ui; background:rgba(255,255,255,0.05); padding:6px 10px; border-radius:6px; display:flex; align-items:center; justify-content:space-between;">
        <span>${escapeHtml(p.username)}</span>
      </li>
    `
    )
    .join("");

  // Show Host Controls if flag is present
  if (msg.isHost !== undefined) {
    startPrivateMatchBtn.style.display = msg.isHost ? "block" : "none";
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
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
  loadingScreenRoot.style.zIndex = "100"; // Highest z-index to cover everything
  loadingScreenRoot.style.transition = "opacity 1.0s ease"; // 1 second fade out animation
  loadingScreenRoot.style.opacity = "1";

  loadingScreenRoot.innerHTML = `
    <div style="font:700 64px system-ui; letter-spacing: 2px; text-transform: uppercase;">Hexbound</div>
  `;
  document.body.appendChild(loadingScreenRoot);

  // Keep it fully visible for 0.5 seconds, then trigger the 1-second fade out transition
  setTimeout(() => {
    loadingScreenRoot.style.opacity = "0";
    // Completely remove it from the DOM structure after the transition ends to clear memory
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
    <div style="font:700 18px system-ui; letter-spacing: 0.5px;">HexBound.io</div>
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
    <div style="font:700 36px system-ui; margin-bottom: 8px;">Play HexBound</div>

    <input id="name"
      placeholder="username"
      style="padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:#0f172a;color:white;min-width:240px;text-align:center;" />

    <button id="play"
      style="padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:#1f2937;color:white;cursor:pointer;min-width:240px;font-weight:600;">
    </button>

    <div id="status" style="opacity:0.9;font:14px system-ui;margin-top:4px;"></div>
  `;

  document.body.appendChild(lobbyRoot);

  playBtn = lobbyRoot.querySelector("#play")!;
  playBtn.textContent = "Play";
  inputEl = lobbyRoot.querySelector("#name")!;
  inputEl.maxLength = 15;

  statusEl = lobbyRoot.querySelector("#status")!;

  // Handle setting name based on Auth State
  setupAuthAndUsername();

  playBtn.onclick = () => {
    const name = inputEl.value.trim();
    if (!name) return;

    clientUIState.username = name;
    clientUIState.phase = "QUEUED";

    playBtn.disabled = true;
    inputEl.disabled = true;
    playBtn.style.opacity = "0.6";

    sendIntent({ type: "JOIN_QUEUE", username: name });
  };

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
    returnRoot.style.display = "none";
  };

  returnRoot.appendChild(btn);
  document.body.appendChild(returnRoot);

  // Close dropdown if clicking outside of the auth container
  window.addEventListener("click", (e) => {
    const dropdown = document.getElementById("auth-dropdown");
    if (dropdown && !topBarAuthContainer.contains(e.target as Node)) {
      dropdown.style.display = "none";
    }
  });
}

/**
 * Handles checking active user sessions and fetching the custom profile name
 * from the database, falling back to a guest name if unauthenticated.
 */
async function setupAuthAndUsername() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session && session.user) {
    // 1. User is Logged In
    try {
      const { data: profile } = await supabase
        .from("players")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle();
        console.log(profile + "   " + profile?.username)

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

    // Lock the username textbox since they are using their registered account name
    isUserAuthenticated = true;
    inputEl.disabled = true;
    inputEl.style.opacity = "0.8";
    inputEl.style.cursor = "default";

    // Update Top Bar to show an interactive dropdown trigger button
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

    // Toggle dropdown UI visibility
    trigger.onclick = (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    };

    // Hover styles for the dropdown item
    logoutBtn.onmouseenter = () => logoutBtn.style.background = "rgba(239, 68, 68, 0.1)";
    logoutBtn.onmouseleave = () => logoutBtn.style.background = "none";

    // Fire log out flow
    logoutBtn.onclick = async () => {
      await supabase.auth.signOut();
      // Re-evaluate authorization states to clear locked fields and reset to guest status
      setupAuthAndUsername();
    };

  } else {
    // 2. Guest User
    const randomId = Math.floor(1000000 + Math.random() * 9000000);
    inputEl.value = `Player_${randomId}`;
    isUserAuthenticated = false;
    inputEl.disabled = false;
    inputEl.style.opacity = "1";
    inputEl.style.cursor = "text";

    // Render Google login button inside the right-hand side of the top bar
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

    // Click handler for top bar OAuth
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

  if (clientUIState.phase === "QUEUED") {
    statusEl.textContent = `Waiting for players: ${lobby.connected}/${lobby.required}`;
  } else {
    statusEl.textContent = `Lobby: ${lobby.connected}/${lobby.required}`;

    inputEl.disabled = isUserAuthenticated;

    playBtn.disabled = false;
    playBtn.style.opacity = "1";
  }

  /* ===== RETURN BUTTON ===== */
  if (state?.gameOver || state?.players.get(String(clientNetState.playerId))?.eliminated === true) {
    returnRoot.style.display = "block";
  } else {
    returnRoot.style.display = "none";
  }
}
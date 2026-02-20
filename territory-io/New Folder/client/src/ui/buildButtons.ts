import type { CoreGameState, PlayerId, BuildingType } from "../../../shared";
import { FORT_COST, BARRACKS_COST } from "../../../shared";
import { clientUIState } from "../state/clientState";
import { toggleBuildMode } from "./buildMode";

type BtnDef = {
  type: BuildingType;
  key: string;
  label: string;
  cost: number;
};

const defs: BtnDef[] = [
  { type: "FORT", key: "1", label: "Fort", cost: FORT_COST },
  { type: "BARRACKS", key: "2", label: "Barracks", cost: BARRACKS_COST },
];

const btnByType = new Map<BuildingType, HTMLButtonElement>();

export function initBuildButtons() {
  const container = document.createElement("div");
  container.id = "build-ui";
  container.style.position = "absolute";
  container.style.bottom = "16px";
  container.style.left = "16px";
  container.style.display = "flex";
  container.style.gap = "10px";
  container.style.zIndex = "10";

  document.body.appendChild(container);

  for (const d of defs) {
    const btn = document.createElement("button");
    btn.textContent = `[${d.key}] ${d.label} (${d.cost})`;
    btn.style.padding = "8px 10px";
    btn.style.borderRadius = "8px";
    btn.style.border = "1px solid rgba(255,255,255,0.2)";
    btn.style.background = "rgba(0,0,0,0.55)";
    btn.style.color = "white";
    btn.style.cursor = "pointer";

    btn.onclick = () => toggleBuildMode(d.type);

    container.appendChild(btn);
    btnByType.set(d.type, btn);
  }
}

export function updateBuildButtons(state: CoreGameState | null, me: PlayerId | null) {

  const container = document.getElementById("build-ui");
  if (!container) return;

  if (clientUIState.phase !== "PLAYING") {
    container.style.display = "none";
    return;
  }

  container.style.display = "flex";

  if (!state || !me) return;

  const p = state.players.get(me);
  if (!p) return;

  for (const d of defs) {
    const btn = btnByType.get(d.type);
    if (!btn) continue;

    const affordable = p.gold >= d.cost;
    const selected = clientUIState.selectedBuilding === d.type;

    btn.disabled = !affordable;

    // Gray out when unaffordable
    btn.style.opacity = affordable ? "1" : "0.35";
    btn.style.cursor = affordable ? "pointer" : "not-allowed";

    // Highlight when selected
    btn.style.outline = selected ? "2px solid rgba(107,124,255,0.9)" : "none";
  }
}

import type { CoreGameState, PlayerId, BuildingType } from "../../../shared";
import { BUILDING_COST, BUILDING_LIMIT, DEMOLISH_REFUND_RATIO } from "../constants";
import { clientUIState } from "../state/clientState";
import { toggleBuildMode } from "./buildMode";


type BtnDef = {
  type: BuildingType;
  key: string;
  label: string;
  cost: number;
  limit: number;
  description: string;
};

const defs: BtnDef[] = [
  { type: "FORT", key: "1", label: `Fort`, cost: BUILDING_COST["FORT"], limit: BUILDING_LIMIT["FORT"],
    description: "Increases defense of nearby tiles."
   },
  { type: "BARRACKS", key: "2", label: "Barracks", cost: BUILDING_COST["BARRACKS"], limit: BUILDING_LIMIT["BARRACKS"],
    description: "Increases production rate of army."
   },
  { type: "HOUSE", key: "3", label: "House", cost: BUILDING_COST["HOUSE"], limit: BUILDING_LIMIT["HOUSE"],
    description: "Increases maximum population size."
   },
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

  // Create Tooltip
  const tooltip = document.createElement("div");
  tooltip.id = "build-tooltip";
  Object.assign(tooltip.style, {
    position: "absolute",
    bottom: "70px", // Appears above the buttons
    left: "16px",
    background: "rgba(0, 0, 0, 0.85)",
    color: "white",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    maxWidth: "200px",
    pointerEvents: "none", // So it doesn't flicker when mouse moves over it
    display: "none",
    zIndex: "100",
    border: "1px solid rgba(255,255,255,0.2)"
  });
  document.body.appendChild(tooltip);

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

    // HOVER LOGIC
    btn.onmouseenter = () => {
      tooltip.innerHTML = `
        <div style="font-weight: bold; color: #facc15; margin-bottom: 4px;">${d.label}</div>
        <div style="opacity: 0.9; line-height: 1.4;">${d.description}</div>
        <div style="opacity: 0.9; line-height: 1.4;">Building cost: ${d.cost} gold</div>
        <div style="opacity: 0.9; line-height: 1.4;">Demolish refund: ${d.cost * DEMOLISH_REFUND_RATIO} gold</div>
      `;
      tooltip.style.display = "block";
      const rect = btn.getBoundingClientRect();
      tooltip.style.left = `${rect.left}px`;
    };

    btn.onmouseleave = () => {
      tooltip.style.display = "none";
    };

    container.appendChild(btn);
    btnByType.set(d.type, btn);

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

    const buildingKey = d.type.toLowerCase() as keyof typeof p.buildings;
    const currentCount = p.buildings[buildingKey] ?? 0;
    const disable = (!affordable || (currentCount >= d.limit));

    btn.disabled = disable
    btn.textContent = `[${d.key}] ` + d.label + ` (${currentCount}/${d.limit})`

    // Gray out when unaffordable
    btn.style.opacity = !disable ? "1" : "0.35";
    btn.style.cursor = !disable ? "pointer" : "not-allowed";

    // Highlight when selected
    btn.style.outline = selected ? "2px solid rgba(107,124,255,0.9)" : "none";
  }
}

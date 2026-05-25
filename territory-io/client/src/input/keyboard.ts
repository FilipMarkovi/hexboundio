import { toggleBuildMode } from "../ui/buildMode";

export function initKeyboard() {
  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;

    if (e.key === "1") toggleBuildMode("FORT");
    if (e.key === "2") toggleBuildMode("BARRACKS");
    if (e.key === "3") toggleBuildMode("HOUSE");
    if (e.key === "4") toggleBuildMode("LABORATORY");
  });
}

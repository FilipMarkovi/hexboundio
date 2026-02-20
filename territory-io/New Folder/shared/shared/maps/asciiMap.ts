import type { GameMapDefinition } from "./types";
import { TerrainType } from "./terrain.js";
const CHAR_TO_TERRAIN: Record<string, TerrainType | null> = {
  G: "GRASS",
  M: "MOUNTAIN",
  B: "BEDROCK",
  R: "ROCK",
  H: "GRASS", // HQ spawn on grass
  ".": null
};

export function asciiToGameMap(
  id: string,
  ascii: string,
  name?: string
): GameMapDefinition {
  const hexes: GameMapDefinition["hexes"] = [];
  const hqSpawns: GameMapDefinition["hqSpawns"] = [];

  // remove empty lines but KEEP indentation
  const lines = ascii
    .split("\n")
    .map(l => l.replace(/\s+$/, ""))
    .filter(l => l.trim().length > 0);

  for (let r = 0; r < lines.length; r++) {
    const line = lines[r];

    // count leading spaces (2 spaces = 1 hex shift visually)
    const leadingSpaces = line.match(/^ */)?.[0].length ?? 0;
    const indentCols = Math.floor(leadingSpaces / 2);

    const cells = line.trim().split(/\s+/);

    for (let col = 0; col < cells.length; col++) {
      const ch = cells[col];
      const terrain = CHAR_TO_TERRAIN[ch];
      if (!terrain) continue;

      // axial q coordinate
      const q = col + indentCols - Math.floor(r / 2);

      hexes.push({ q, r, terrain });

      if (ch === "H") {
        hqSpawns.push({ q, r });
      }
    }
  }

  return {
    id,
    name: name ?? id,
    hexes,
    hqSpawns
  };
}

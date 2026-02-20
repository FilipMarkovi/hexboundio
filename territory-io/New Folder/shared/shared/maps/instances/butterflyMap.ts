import { asciiToGameMap } from "../asciiMap.js";

export const butterflyMap = asciiToGameMap(
  "butterfly", // map id
  `
        . . G G G . .
      . G G G M G G .
    . G G G R H G G .
      . G G G R G G .
        . . G G G . .
            R . . . . M M G
        M R R R M M M M R G G
            R . . . . M M G
        . . G G G . .
      . G G G M G G .
    . G G G G H G G .
      . G G G M G G .
        . . G G G . .
  `,
  "Butterfly Map"
);
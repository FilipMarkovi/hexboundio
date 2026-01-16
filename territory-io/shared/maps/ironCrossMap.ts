import { asciiToGameMap } from "./asciiMap.js";

export const ironCrossMap = asciiToGameMap(
  "iron-cross",
  `
                B B B B B B B B B B B
            B B G G G R R G G G G B B
        B B G G G R R M H R R G G G B B
      B B G G R R M M B B M M R R G G B B
    B B G R R M M B B B B B B M M R R G B B
  B B G G R M M B B G G G G B B M M R G G B .
B G G G R M B B G G G G G G B B M R G G G B
B G G G G R B G G G G G G G G B R G G G G B
B G G G G G G G G G G G G G G G G G G G G B
B R H B B G G G G G G G G G G G G B B M R B
B R M B B G G G G G G G G G G G G B B M R B
B G G G G G G G G G G G G G G G G G G G G B
B G G G G R B G G G G G G G G B R G G G G B
B G G G R M B B G G G G G G B B M R G G G B
  B B G G R M M B B G G G G B B M M R G G B .
    B B G R R M M B B B B B B M M R R G B B
      B B G G R R M M B B M M R R G G B B
        B B G G G R R M H R R G G G B B
            B B G G G G R R G G G G B B
                B B B B B B B B B B B
  `,
  "Iron Cross Basin"
);

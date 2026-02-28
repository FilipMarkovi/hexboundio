import { asciiToGameMap } from "../asciiMap.js";

export const eightWayMap = asciiToGameMap(
  "eight-way",
    `
        . . . . . . . . . . . . . . . . . . . . . . . . . . 
       . . . . . . . . . . . R . . R . . . . . . . . . . .
        . . . . . . . G H G G R . R G G H G . . . . . . . .
       . . . . . . . . G G . . R R . . G G . . . . . . . .
        . . . . . . . . . . . . R . . . . . . . . . . . . .
       . . . . . . . . . . . . R R . . . . . . . . . . . .
        . . . G H G . . . . . . R . . . . . . G H G . . . .
       . . . . G G . . . . . . R R . . . . . . G G . . . .
        . . . . G . . . . . . M M M . . . . . . G . . . . .
       . . . . R R . . . . R M . . M R . . . . R R . . . .
        . . . . R R R R R R M . B . M R R R R R R . . . . .
       . . . . R R . . . . R M . . M R . . . . R R . . . .
        . . . . G . . . . . . M M M . . . . . . G . . . . .
       . . . . G G . . . . . . R R . . . . . . G G . . . .
        . . . G H G . . . . . . R . . . . . . G H G . . . .
       . . . . . . . . . . . . R R . . . . . . . . . . . .
        . . . . . . . . . . . . R . . . . . . . . . . . . .
       . . . . . . . . G G . . R R . . G G . . . . . . . .
        . . . . . . . G H G G R . R G G H G . . . . . . . .
       . . . . . . . . . . . R . . R . . . . . . . . . . .
  `,
  "Eight Way"
);

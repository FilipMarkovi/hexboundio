import { asciiToGameMap } from "../asciiMap.js";

export const mountainsMap = asciiToGameMap(
  "mountains", // map id
  `
        . . . . . . . . . . . .
       M M M M B . . B M M M M 
        G G G G B . B G G G G G 
       G G H G G B B G G H G G 
        G G G G G B G G G G G G 
       G G G G G G G G G G G G 
        G G G G G G G G G G G G 
       G G G G B B B B G G G G 
        G G G G G G G G G G G G 
       G G G G G G G G G G G G 
        G G G G G B G G G G G G 
       G G H G G B B G G H G G 
        G G G G B . B G G G G G 
       M M M M B . . B M M M M 
  `,
  "Mountains Map"
);



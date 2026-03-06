import { asciiToGameMap } from "../asciiMap.js";

export const amazon = asciiToGameMap(
  "amazon",
  `
    . . M M M M M M M M M M M M M M M M M M M M M M M M . . 
     . M G G G G G G G G G G G G G G G G G G G G G G G M . .
    . M G H G G G G G G G G G M M G G G G G G G G G H G M .
     . M G G G G G G G G G G M . M G G G G G G G G G G M . .
    M M G G G G G G G G H G M . . M G H G G G G G G G G M M
     M G G G G G G G G G G G M . M G G G G G G G G G G G M .
    M G G G G G G G G G G G M . . M G G G G G G G G G G G M
     M M M M R R R M M M M M M . M M M M M M R R R M M M M .
    . . . . . R R . . . . . . . . . . . . . . R R . . . . .
     . . . . R R R . . . . . . . . . . . . . R R R . . . . .
    . . . . . R R . . . . . . . . . . . . . . R R . . . . .
     M M M M R R R M M M M M M . M M M M M M R R R M M M M .
    M G G G G G G G G G G G M . . M G G G G G G G G G G G M
     M G G G G G G G G G G G M . M G G G G G G G G G G G M .
    M M G G G G G G G G H G M . . M G H G G G G G G G G M M
     . M G G G G G G G G G G M . M G G G G G G G G G G M . .
    . M G H G G G G G G G G G M M G G G G G G G G G H G M .
     . M G G G G G G G G G G G G G G G G G G G G G G G M . .
    . . M M M M M M M M M M M M M M M M M M M M M M M M . . 
  `,
  "The Amazon River"
);
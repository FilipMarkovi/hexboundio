import { asciiToGameMap } from "../asciiMap.js";

export const hugeMap = asciiToGameMap(
  "huge", // map id
  `
        G G G G R R R G G G G
       G G G G R . . R G G G G 
        G G G G R . R G G G G  
       G G H G G R R G G H G G 
      G G G G G G G G G G G G G
     G G G G G G R R G G G G G G
    G G G G G R R . R R G G G G G  
   G H G G G R M . . M R G G G H G 
    G G G G G R R . R R G G G G G 
     G G G G G G R R G G G G G G 
      G G G G G G G G G G G G G 
       G G H G G R R G G H G G 
        G G G G R . R G G G G  
       G G G G R . . R G G G G
        G G G G R R R G G G G
  `,
  "Huge Map"
);



import { asciiToGameMap } from "../asciiMap.js";

export const octagon = asciiToGameMap(
  "octagon",
  `
  . . . . . . . . . . . . . . . . . . . . . .
             G G G G G H G G G G G
            G G G G G G G G G G G G
           G G R R G G G G G R R G G
          G G R M R G G G G R M R G G
         G G G R G G G G G G G R G G G
        H G G G G G G G G G G G G G G H
       G G G G G G R R R R G G G G G G G
      G G G G G R R M M M M R R G G G G G
     G G G G R R M M . . M M R R G G G G G
    G G G G R M M . . . . . . M M R G G G G
   G G G G R M . . . R R . . . M R G G G G G
  G G G G G R M . . R M M R . . M R G G G G G
 G G G G G G R . . R M M R . . R G G G G G G G
H G G G G G G R . . R R R R . . R G G G G G G H
 G G G G G G R . . . . . . . . R G G G G G G G
  G G G G G G R . . R R R R . . R G G G G G G
   G G G G G R M . . R M M R . . M R G G G G
    G G G G R M . . . R R . . . M R G G G G
     G G G G R M M . . . . . . M M R G G G
      G G G G R R M M . . M M R R G G G G
       G G G G G R R M M M M R R G G G G 
        H G G G G G R R R R G G G G G H
         G G G G G G G G G G G G G G G
          G G G R G G G G G G G R G G
           G G R M R G G G G R M R G
            G G R R G G G G G R R G
             G G G G G H G G G G G
  `,
  "The Octagon"
);
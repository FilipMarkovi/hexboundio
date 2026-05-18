export const tileTextures = {
  grass: null as CanvasPattern | null,
  desert: null as CanvasPattern | null,
  mountain: null as CanvasPattern | null,
  water: null as CanvasPattern | null,
};

const asset_folder = "../../../assets/";

export function loadGameTextures(ctx: CanvasRenderingContext2D, onComplete: () => void) {
  let loadedCount = 0;
  const totalImages = 3;

  function checkLoad() {
    loadedCount++;
    if (loadedCount === totalImages) {
      onComplete(); 
    }
  }

  const grassImg = new Image();
  grassImg.src = asset_folder + "grass.jpg"; 
  grassImg.onload = () => {
    tileTextures.grass = ctx.createPattern(grassImg, "repeat");
    checkLoad();
  };

  const desertImg = new Image();
  desertImg.src = asset_folder + "desert.jpg"; 
  desertImg.onload = () => {
    tileTextures.desert = ctx.createPattern(desertImg, "repeat");
    checkLoad();
  };

  const mountainImg = new Image();
    mountainImg.src = asset_folder + "mountain.jpg"; 
    mountainImg.onload = () => {
      tileTextures.mountain = ctx.createPattern(mountainImg, "repeat");
      checkLoad();
    };

  const waterImg = new Image();
  waterImg.src = asset_folder + "water.jpg"; 
  waterImg.onload = () => {
    tileTextures.water = ctx.createPattern(waterImg, "repeat");
    checkLoad();
  };
}
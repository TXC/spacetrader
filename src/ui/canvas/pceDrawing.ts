import type { PCEImage } from '../../game/PCEImage.ts';

const pngCache: Record<string, string> = {};

// Draws the image with each of its pixels `scale` wide, its top left corner at the offset.
export function drawInCanvas(
  image: PCEImage,
  canvas: HTMLCanvasElement,
  scale: number,
  xOffset = 0,
  yOffset = 0
) {
  const ctx = canvas.getContext('2d')!;

  // Work around visible horizontal lines caused by a yOffset that's
  // not aligned with a whole pixel value
  yOffset = Math.floor(yOffset);

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const character = image.imageStrLines[image.firstPixelLineIndex + y].charAt(x);
      ctx.fillStyle = image.charToColor[character];
      ctx.fillRect(xOffset + x * scale, yOffset + y * scale, scale, scale);
    }
  }
}

// Returns base64 data URL
export function generatePNG(image: PCEImage, scale: number) {
  const cacheKey = image.imageStr() + '_' + scale;
  const cachedImg = pngCache[cacheKey];

  if (cachedImg) {
    return cachedImg;
  }

  const canvas = document.createElement('canvas');
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  drawInCanvas(image, canvas, scale);

  const result = canvas.toDataURL();
  pngCache[cacheKey] = result;

  return result;
}

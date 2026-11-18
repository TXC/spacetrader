export const sPCEImageCache: Record<string, string> = {};

// Pixel-Character Encoded Image
export class PCEImage {
  declare _imageStr: string;
  declare imageStrLines: string[];
  declare charToColor: Record<string, string>;
  declare firstPixelLineIndex: number;
  declare width: number;
  declare height: number;

  // Properties:
  // imageStrLines - string, full image: color table and pixel data, split by \n into an array
  // charToColor - map from string (ASCII character) to string (hex color code)
  // firstPixelLineIndex - integer, index into imageStrLines for the first line of pixel characters
  // width - integer, width of image in pixels
  // height - integer, height of image in pixels
  constructor(imageStr: string) {
    this._imageStr = imageStr;
    this.imageStrLines = imageStr.split('\n');

    // Parse the color table
    this.charToColor = {};

    let colorTableLineCount = 0;
    for (const line of this.imageStrLines) {
      colorTableLineCount++;

      if (line == '') {
        break;
      }

      if (line.startsWith('//')) {
        continue;
      }

      const charAndColor = line.split(':');
      if (charAndColor.length == 2) {
        this.charToColor[charAndColor[0]] = charAndColor[1];
      }
    }

    this.firstPixelLineIndex = colorTableLineCount;

    if (this.imageStrLines.length > this.firstPixelLineIndex) {
      this.width = this.imageStrLines[this.firstPixelLineIndex].length;
      this.height = this.imageStrLines.length - this.firstPixelLineIndex;
    } else {
      this.width = 0;
      this.height = 0;
    }
  }

  imageStr() {
    return this._imageStr;
  }

  imageStrLineAtPixelRow(pixelRow: number) {
    if (pixelRow >= this.height) {
      return null;
    }

    return this.imageStrLines[this.firstPixelLineIndex + pixelRow];
  }

  // colorTransformFn(hexColorStr) => transformedHexColorStr
  drawInCanvas(
    canvas: HTMLCanvasElement,
    scale: number,
    xOffset?: number /* default: 0 */,
    yOffset?: number /* default: 0 */,
    colorTransformFn?: ((hexColorStr: string) => string) | null /* default: null */
  ) {
    if (!xOffset) {
      xOffset = 0;
    }
    if (!yOffset) {
      yOffset = 0;
    }

    const ctx = canvas.getContext('2d')!;

    // Work around visible horizontal lines caused by a yOffset that's
    // not aligned with a whole pixel value
    yOffset = Math.floor(yOffset);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const pixelDimension = scale;
        const pixelXOffset = x * scale;
        const pixelYOffset = y * scale;

        const character = this.imageStrLines[this.firstPixelLineIndex + y].charAt(x);
        let color = this.charToColor[character];
        if (colorTransformFn) {
          color = colorTransformFn(color);
        }

        ctx.fillStyle = color;
        ctx.fillRect(
          xOffset + pixelXOffset,
          yOffset + pixelYOffset,
          pixelDimension,
          pixelDimension
        );
      }
    }
  }

  // Returns base64 data URL
  generatePNG(scale: number) {
    const cacheKey = this._imageStr + '_' + scale;
    const cachedImg = sPCEImageCache[cacheKey];

    if (cachedImg) {
      return cachedImg;
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.width * scale;
    canvas.height = this.height * scale;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawInCanvas(canvas, scale);

    const result = canvas.toDataURL();
    sPCEImageCache[cacheKey] = result;

    return result;
  }
}

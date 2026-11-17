import { Utils } from './Utilities.ts';

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

  updateImageStrLineAtPixelRow(pixelRow: number, newValue: string) {
    if (pixelRow >= this.height || newValue.length != this.width) {
      return;
    }

    this.imageStrLines[this.firstPixelLineIndex + pixelRow] = newValue;
  }

  usesTransparency() {
    let ret = false;

    const imageStr = this.imageStrLines.slice(this.firstPixelLineIndex).join('');

    for (const colorChar of Object.keys(this.charToColor)) {
      const colorStr = this.charToColor[colorChar];

      // Don't check this color if the image contains no pixels that use it
      if (!imageStr.includes(colorChar)) {
        continue;
      }

      const match = colorStr.match(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})/);
      if (match) {
        const hasTransparency = match[1].toUpperCase() !== 'FF';
        ret = hasTransparency;
      }

      if (ret) {
        break;
      }
    }

    return ret;
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

  // Returns a new PCEImage instance which combines `this` and `other`
  // by appending `other` to the right of `this`. `separator` is added
  // to every line between the two images.
  // If the images are not the same height, `blankSpaceFiller` will be used
  // to make them the same height.
  // Example:
  //
  // pceImageA:
  //.:#00000000
  //a:#000000
  //
  //aaa
  //aaa
  //aaa
  //aaa
  //aaa
  //
  // pceImageB:
  //.:#00000000
  //b:#FFFFFF
  //
  //bbb
  //bbb
  //bbb
  //bbb
  //
  // pceImageA.newPCEImageByAppendingOnRight(pceImageB, ".", "a"):
  //.:#00000000
  //a:#000000
  //b:#FFFFFF
  //
  //aaa.bbb
  //aaa.bbb
  //aaa.bbb
  //aaa.bbb
  //aaa.aaa
  //
  // Currently unhandled edge cases:
  // - Color tables where a character is mapped to different colors in the two images
  // - blankSpaceFiller that is longer than one character
  // - separator or blankSpaceFiller which are not already in the color table of at least one of this, other
  newPCEImageByAppendingOnRight(other: PCEImage, separator: string, blankSpaceFiller: string) {
    // Union the color tables
    const unionedCharToColor: Record<string, string> = {};

    for (const colorChar of Object.keys(this.charToColor)) {
      const colorStr = this.charToColor[colorChar];
      unionedCharToColor[colorChar] = colorStr;
    }

    for (const colorChar of Object.keys(other.charToColor)) {
      const colorStr = other.charToColor[colorChar];
      unionedCharToColor[colorChar] = colorStr;
    }

    // Make the new combined string representation, making the images the same height
    const unionedHeight = Math.max(this.height, other.height);

    const unionedImageStrLines: string[] = [];

    for (let i = 0; i < unionedHeight; ++i) {
      let leftLine = this.imageStrLineAtPixelRow(i);
      let rightLine = other.imageStrLineAtPixelRow(i);

      if (!leftLine) {
        leftLine = blankSpaceFiller.repeat(this.width);
      }

      if (!rightLine) {
        rightLine = blankSpaceFiller.repeat(other.width);
      }

      const combinedLine = leftLine + separator + rightLine;

      unionedImageStrLines.push(combinedLine);
    }

    // Add the color table to the beginning of unionedImageStrLines
    let colorTableStr = '';
    for (const colorChar of Object.keys(unionedCharToColor).sort()) {
      const colorStr = unionedCharToColor[colorChar];
      colorTableStr += colorChar + ':' + colorStr + '\n';
    }

    const imageStr = colorTableStr + '\n' + unionedImageStrLines.join('\n');

    // Create the new PCEImage
    return new PCEImage(imageStr);
  }

  // Replace the rectangle with top left corner (x, y)
  // and replacementImg.width, replacementImg.height
  overwritePixelsWithPCEImage(x: number, y: number, replacementImg: PCEImage) {
    // Example to work through the math:
    //
    //   0 1 2 3 4
    // 0 . . . . .
    // 1 . . . . .
    // 2 . . . . .
    // 3 . . o o o
    // 4 . . o o o
    //
    // this.width is 5
    // this.height is 5
    // replacementImg.width is 3
    // replacementImg.height is 2
    // x is 2
    // y is 3

    if (x < 0 || x + replacementImg.width > this.width) {
      console.log(
        'PCEImage overwitePixelsWithPCEImage failed: replacementImg does not fit within width'
      );
      return;
    }

    if (y < 0 || y + replacementImg.height > this.height) {
      console.log(
        'PCEImage overwitePixelsWithPCEImage failed: replacementImg does not fit within height'
      );
      return;
    }

    for (let j = 0; j < replacementImg.height; ++j) {
      const replacementLine = replacementImg.imageStrLineAtPixelRow(j)!;

      const oldLine = this.imageStrLineAtPixelRow(y + j)!;

      const newLine =
        oldLine.substring(0, x) + replacementLine + oldLine.substring(x + replacementLine.length);

      this.updateImageStrLineAtPixelRow(y + j, newLine);
    }
  }
}

export class PCEPixel {
  declare str: string;
  declare x: number;
  declare y: number;

  constructor(str: string, x: number, y: number) {
    this.str = str;
    this.x = x;
    this.y = y;
  }

  canClumpWith(pixel: PCEPixel) {
    const sameColor = this.str == pixel.str;
    const adjacent = Math.abs(this.x - pixel.x) + Math.abs(this.y - pixel.y) <= 1;
    return sameColor && adjacent;
  }
}

export class PCEClump {
  declare pixels: PCEPixel[];

  constructor() {
    this.pixels = [];
  }

  canClumpWith(pixel: PCEPixel) {
    if (this.pixels.length == 0) {
      return true;
    }

    for (const cPixel of this.pixels) {
      if (cPixel.canClumpWith(pixel)) {
        return true;
      }
    }

    return false;
  }

  addPixel(pixel: PCEPixel) {
    this.pixels.push(pixel);
  }

  size() {
    return this.pixels.length;
  }

  str() {
    return this.pixels[0].str;
  }
}

export class PCEWobbleImage extends PCEImage {
  declare maxTicks: number;
  declare tickCount: number;
  declare charToCount: Record<string, number>;
  declare clumps: PCEClump[];

  // Properties:
  // tickCount - integer, count of animation time increments that have occurred
  // maxTicks - animation loop duration in ticks
  // clumps - array of PCEPixel
  // charToCount - map of string (pixel character) to number of pixels with that char
  constructor(imageStr: string) {
    super(imageStr);

    this.maxTicks = 4;
    this.tickCount = 0;

    this.charToCount = {};
    this.clumps = [];
    this.computeClumps();
  }

  computeClumps() {
    const maxClumpSize = 20;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const character = this.imageStrLines[this.firstPixelLineIndex + y].charAt(x);

        if (!this.charToCount[character]) {
          this.charToCount[character] = 0;
        }
        this.charToCount[character]++;

        const pixel = new PCEPixel(character, x, y);

        let addedPixel = false;
        for (const clump of this.clumps) {
          if (clump.size() < maxClumpSize && clump.canClumpWith(pixel)) {
            clump.addPixel(pixel);
            addedPixel = true;
            break;
          }
        }

        if (!addedPixel) {
          const clump = new PCEClump();
          clump.addPixel(pixel);
          this.clumps.push(clump);
        }
      }
    }

    // Sort by most common color (and largest clump size) to least common color (and smaller clump size)
    // This order will let us draw the "background" before finer details which makes the wobble image look less messy/glitchy
    const charToCount = this.charToCount;
    this.clumps.sort(function (a, b) {
      const charA = a.str();
      const charB = b.str();

      const colorCountA = charToCount[charA];
      const colorCountB = charToCount[charB];

      if (colorCountA > colorCountB) {
        return -1; // sort a before b
      } else if (colorCountB > colorCountA) {
        return 1;
      } else {
        return b.size() - a.size(); // return negative when a is bigger
      }
    });
  }

  tick() {
    this.tickCount = (this.tickCount + 1) % this.maxTicks;
  }

  drawInCanvas(
    canvas: HTMLCanvasElement,
    scale: number,
    xOffset?: number /* default: 0 */,
    yOffset?: number /* default: 0 */
  ) {
    if (!xOffset) {
      xOffset = 0;
    }
    if (!yOffset) {
      yOffset = 0;
    }

    const ctx = canvas.getContext('2d')!;

    for (const clump of this.clumps) {
      const pixelDimension = scale;

      // Wobble
      let xWobble = 0;
      let yWobble = 0;
      const offsets = [-1, 0, 1];
      const wobbleMagnitude = Math.ceil(scale / 10);
      // My original intent is to use tickCount to deterministically wobble
      // I haven't implemented that yet -- for now, wobble is random
      const offset = Math.round(
        offsets[Math.floor(Math.random() * offsets.length)] * wobbleMagnitude
      );

      if (offset != 0) {
        if (Math.floor(Math.random() * 2) == 0) {
          xWobble = offset;
        } else {
          yWobble = offset;
        }
      }

      for (const pixel of clump.pixels) {
        const color = this.charToColor[pixel.str];

        ctx.fillStyle = color;

        let pixelXOffset = pixel.x * scale;
        let pixelYOffset = pixel.y * scale;

        pixelXOffset += xWobble;
        pixelYOffset += yWobble;

        // Draw every pixel slightly larger so there are no gaps between pixels caused by wobble
        // Square pixels
        //ctx.fillRect(pixelXOffset-wobbleMagnitude, pixelYOffset-wobbleMagnitude, pixelDimension+2*wobbleMagnitude, pixelDimension+2*wobbleMagnitude)
        // Roundrect pixels
        // @ts-expect-error old bug kept: Utils.roundRect does not exist; nothing draws a wobble image
        Utils.roundRect(
          ctx,
          xOffset + pixelXOffset - wobbleMagnitude,
          yOffset + pixelYOffset - wobbleMagnitude,
          pixelDimension + 2 * wobbleMagnitude,
          pixelDimension + 2 * wobbleMagnitude,
          2,
          true,
          false
        );
      }
    }
  }

  // Generates GIF synchronously - this can be slow!
  // Returns base64 data URL
  generateGIF(scale: number) {
    const canvas = document.createElement('canvas');
    canvas.width = this.width * scale;
    canvas.height = this.height * scale;

    if (canvas.width === 0 || canvas.height === 0) {
      console.log('Skipping GIFGeneration because dimension is 0');
      return;
    }

    const ctx = canvas.getContext('2d')!;

    // @ts-expect-error old bug kept: the GIF library was never loaded; generateGIF has no callers

    const encoder = new GIFEncoder();
    encoder.setRepeat(0);
    encoder.setDelay(150);
    encoder.start();
    const usesTransparency = this.usesTransparency();
    if (usesTransparency) {
      encoder.setTransparent(0xfffff1);
    }

    for (let i = 0; i < this.maxTicks; i++) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFF1';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.drawInCanvas(canvas, scale);
      this.tick();

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      encoder.addFrame(imageData, true);
    }

    encoder.finish();

    const gifData = encoder.stream().getData();

    // @ts-expect-error old bug kept, see GIFEncoder above

    const base64GIFStr = 'data:image/gif;base64,' + encode64(gifData);
    return base64GIFStr;
  }
}

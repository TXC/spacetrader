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

      if (line === '') {
        break;
      }

      if (line.startsWith('//')) {
        continue;
      }

      const charAndColor = line.split(':');
      if (charAndColor.length === 2) {
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
}

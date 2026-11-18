import type { ShipModel } from '../game/Ship.ts';

// How many times larger than its pixel art a ship is drawn, at the smallest text size.
const SCALE = 3;

// A ship's pixel art. Its size follows the page's text size, so it grows with the window;
// 15px of picture is 1rem.
export function ShipPicture({ model, flipped }: { model: ShipModel; flipped?: boolean }) {
  const image = model.shipImage;
  const width = `${(image.width * SCALE) / 15}rem`;
  return (
    <img
      className={'full-width-img' + (flipped ? ' flipped' : '')}
      alt={model.name}
      src={image.generatePNG(SCALE)}
      style={{ width }}
    />
  );
}

import { PCEImageLibrary } from '../game/Images.ts';

// One of the pixel-art icons, by name. Unknown names fall back to the news icon.
export function Icon({ name, className }: { name: string; className: string }) {
  // Decoration: the text it belongs to is always beside it.
  return (
    <img className={className} alt="" src={PCEImageLibrary.pceImageForName(name).generatePNG(1)} />
  );
}

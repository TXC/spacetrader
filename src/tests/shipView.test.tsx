import { flushSync } from 'react-dom';
import { expect, test } from 'vitest';
import { Ship, ShipModelType } from '../game/Ship.ts';
import { ShipView } from '../ui/ShipView.tsx';
import { render } from './support/render.tsx';

// How much of its container the bar fills right now, from 0 to 1.
function filled(bar: HTMLElement): number {
  const width = (element: Element) => parseFloat(getComputedStyle(element).width);
  return Math.round((width(bar) / width(bar.parentElement!)) * 100) / 100;
}

// A bar should slide when the ship is hit, not when the ship first appears.
test('a damaged ship appears with its hull bar already at the right width', () => {
  const ship = new Ship(ShipModelType.Gnat, 2);
  ship.damageHullByAmount(50);

  const { host } = render(<ShipView ship={ship} enemy fade animate />);

  const bar = host.querySelector<HTMLElement>('#battle-hpBar-enemy')!;
  expect(bar.style.width).toBe('50%');
  expect(filled(bar)).toBe(0.5);
});

test('after it has appeared, the bar slides to a new width', async () => {
  const ship = new Ship(ShipModelType.Gnat, 2);
  const { host, root } = render(<ShipView ship={ship} enemy fade animate />);
  const bar = host.querySelector<HTMLElement>('#battle-hpBar-enemy')!;
  expect(filled(bar)).toBe(1);
  await new Promise(resolve => setTimeout(resolve, 50));

  ship.damageHullByAmount(50);
  flushSync(() => root.render(<ShipView ship={ship} enemy fade animate />));

  expect(bar.style.width).toBe('50%');
  expect(getComputedStyle(bar).transitionDuration).toBe('0.2s');
  expect(filled(bar)).toBe(1);
});

test('the bar keeps its proportion when its container changes size', () => {
  const ship = new Ship(ShipModelType.Gnat, 2);
  ship.damageHullByAmount(50);
  const { host } = render(<ShipView ship={ship} enemy fade={false} />);
  const bar = host.querySelector<HTMLElement>('#battle-hpBar-enemy')!;

  bar.parentElement!.style.width = '300px';

  expect(getComputedStyle(bar).width).toBe('150px');
});

import { flushSync } from 'react-dom';
import { afterEach, expect, test, vi } from 'vitest';
import { Ship, ShipModelType } from '../game/Ship.ts';
import { Opponents } from '../ui/Travel.tsx';
import { render } from './support/render.tsx';

afterEach(() => vi.useRealTimers());

// When one opponent follows another, the old ship fades out over two seconds while the
// new one fades in. For the fade to show, the old ship must stay the same element.
test('a departing opponent stays on the page, fading, for two seconds', () => {
  vi.useFakeTimers();
  const first = new Ship(ShipModelType.Gnat, 2);
  const second = new Ship(ShipModelType.Firefly, 2);
  const { host, root } = render(<Opponents ship={first} />);
  flushSync(() => vi.advanceTimersByTime(20));
  const firstView = host.querySelector('[data-ship]')!;
  expect(firstView.hasAttribute('data-shown')).toBe(true);

  flushSync(() => root.render(<Opponents ship={second} />));

  const views = [...host.querySelectorAll('[data-ship]')];
  expect(views.length).toBe(2);
  expect(views[0]).toBe(firstView);
  expect(firstView.hasAttribute('data-shown')).toBe(false);

  flushSync(() => vi.advanceTimersByTime(2000));
  expect(host.querySelectorAll('[data-ship]').length).toBe(1);
  expect(host.querySelector('#battle-hpContainer-enemy-Firefly')).not.toBeNull();
});

test('two opponents leaving in quick succession are each removed in their own time', () => {
  vi.useFakeTimers();
  const ships = [ShipModelType.Gnat, ShipModelType.Firefly, ShipModelType.Mosquito].map(
    type => new Ship(type, 2)
  );
  const { host, root } = render(<Opponents ship={ships[0]} />);
  const count = () => host.querySelectorAll('[data-ship]').length;
  flushSync(() => root.render(<Opponents ship={ships[1]} />));
  flushSync(() => vi.advanceTimersByTime(1000));
  flushSync(() => root.render(<Opponents ship={ships[2]} />));
  expect(count()).toBe(3);

  flushSync(() => vi.advanceTimersByTime(1000));
  expect(count()).toBe(2);

  flushSync(() => vi.advanceTimersByTime(1000));
  expect(count()).toBe(1);
});

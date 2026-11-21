import { flushSync } from 'react-dom';
import { expect, test } from 'vitest';
import { StateTree } from '../ui/StateTree.tsx';
import { render } from './support/render.tsx';

test('shows leaves as JSON', () => {
  const { host } = render(<StateTree name="game" value={{ a: 5, b: '5', c: null, d: true }} />);
  const text = host.textContent;
  expect(text).toContain('a: 5');
  expect(text).toContain('b: "5"');
  expect(text).toContain('c: null');
  expect(text).toContain('d: true');
});

test('starts with every branch closed', () => {
  const { host } = render(<StateTree name="game" value={{ commander: { ship: { hull: 3 } } }} />);
  const branches = [...host.querySelectorAll('details')];
  expect(branches.length).toBe(3);
  expect(branches.map(branch => branch.open)).toEqual([false, false, false]);
});

test('names a list with its length', () => {
  const { host } = render(<StateTree name="game" value={{ cargo: [1, 2, 3] }} />);
  const names = [...host.querySelectorAll('summary')].map(summary => summary.textContent);
  expect(names).toContain('cargo [3]');
});

test('keeps an opened branch open', () => {
  const { host, root } = render(<StateTree name="game" value={{ x: { y: 1 } }} />);
  const branch = () =>
    [...host.querySelectorAll('details')].find(
      details => details.querySelector('summary')!.textContent === 'x'
    )!;
  branch().open = true;

  flushSync(() => root.render(<StateTree name="game" value={{ x: { y: 2 } }} />));

  expect(branch().open).toBe(true);
  expect(branch().textContent).toContain('y: 2');
});

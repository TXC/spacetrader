// Helpers for the recorded tests: check what the player sees, not how the page is built.

function resolve(target: Element | null): Element {
  if (!target) throw new Error('The element is not on the page');
  return target;
}

function nodeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? '';
  if (node.nodeName === 'BR') return '\n';
  return [...node.childNodes].map(nodeText).join('');
}

// The visible text of an element, with each line break as "\n".
export function textOf(target: Element | null): string {
  return nodeText(resolve(target));
}

// True when an element under `root` matching `selector` has exactly this text.
export function hasText(root: Element | null, selector: string, text: string): boolean {
  return [...resolve(root).querySelectorAll(selector)].some(e => textOf(e) === text);
}

// The text of the table cell right after the cell whose text is `label`, or null.
export function cellAfter(root: Element | null, label: string): string | null {
  const cell = [...resolve(root).querySelectorAll('td')].find(td => textOf(td) === label);
  const next = cell?.nextElementSibling;
  return next ? textOf(next) : null;
}

// The table row right after the row holding a heading cell with this text, or null.
export function rowAfterHeading(heading: string): Element | null {
  const th = [...document.querySelectorAll('th')].find(e => textOf(e) === heading);
  return th?.closest('tr')?.nextElementSibling ?? null;
}

// ---- finding things the way a player does: by what they are and what they say ----------

function find<T extends Element>(selector: string, text: string | RegExp): T | null {
  const matches = (e: Element) =>
    typeof text === 'string' ? textOf(e) === text : text.test(textOf(e));
  return [...document.querySelectorAll<T>(selector)].find(matches) ?? null;
}

// The button or link with this text.
export const button = (text: string | RegExp) => find<HTMLElement>('button, a', text);

// The heading with this text.
export const heading = (text: string | RegExp) => find<HTMLElement>('h1, h2, h3, h4', text);

// The table row whose first cell has this text.
export function tableRow(firstCell: string): HTMLTableRowElement | null {
  return find<HTMLElement>('tr > :first-child', firstCell)?.closest('tr') ?? null;
}

// The "Welcome to ..." heading of the system the player has landed on, and the
// description under it.
export const welcome = () => heading(/^Welcome to /);
export const systemInfo = () => welcome()?.nextElementSibling ?? null;

// The few things with no role or fixed text of their own. Only this file knows their names.
const part = (selector: string) => () => document.querySelector<HTMLElement>(selector);
export const news = part('#newsStrDiv');
export const mapInfo = part('.gv-system-info');
export const warpMessage = part('#warpMessage');
export const encounterBox = part('#eVC_dialog');
export const scoreMessage = part('#end-message');
export const repairs = part('#repairDiv');
export const specialCargo = part('#cargoListDiv');
export const openQuests = part('#questListDiv');
export const highScores = part('#highscores');
export const difficulty = () => document.querySelector('select');
// The topmost alert, and its title.
export const alertBox = () =>
  [...document.querySelectorAll<HTMLElement>('.alert-backdrop')].at(-1) ?? null;
export const alertTitle = () => alertBox()?.querySelector<HTMLElement>('.alert-title') ?? null;
// The hull bar of the player's ship ('self') or the opponent's ('enemy'), and the frame
// around the hull bar of the ship with this name.
type Side = 'self' | 'enemy';
export const hullBar = (side: Side) => document.querySelector<HTMLElement>(`#battle-hpBar-${side}`);
export const hullFrame = (side: Side, ship: string) =>
  document.querySelector<HTMLElement>(`#battle-hpContainer-${side}-${ship}`);

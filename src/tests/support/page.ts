// Helpers for the recorded tests: check what the player sees, not how the page is built.

function resolve(target: string | Element): Element {
  const element = typeof target === 'string' ? document.getElementById(target) : target
  if (!element) throw new Error(`No element with id "${String(target)}"`)
  return element
}

function nodeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? ''
  if (node.nodeName === 'BR') return '\n'
  return [...node.childNodes].map(nodeText).join('')
}

// The visible text of an element, with each line break as "\n".
export function textOf(target: string | Element): string {
  return nodeText(resolve(target))
}

// True when an element under `root` matching `selector` has exactly this text.
export function hasText(root: string | Element, selector: string, text: string): boolean {
  return [...resolve(root).querySelectorAll(selector)].some((e) => textOf(e) === text)
}

// The text of the table cell right after the cell whose text is `label`, or null.
export function cellAfter(root: string | Element, label: string): string | null {
  const cell = [...resolve(root).querySelectorAll('td')].find((td) => textOf(td) === label)
  const next = cell?.nextElementSibling
  return next ? textOf(next) : null
}

// The table row right after the row holding a heading cell with this text, or null.
export function rowAfterHeading(heading: string): Element | null {
  const th = [...document.querySelectorAll('th')].find((e) => textOf(e) === heading)
  return th?.closest('tr')?.nextElementSibling ?? null
}

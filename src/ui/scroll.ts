// Runs `block`, which changes what is on the page, and then puts the page back where the
// player had scrolled to.
let level = 0;

export function maintainScrollPosition(block: () => void): void {
  const { scrollX, scrollY } = window;
  level++;
  block();
  level--;
  if (level !== 0) return;
  window.scrollTo(scrollX, scrollY);
  // Usually enough at once; trying again a moment later lets the layout settle.
  setTimeout(() => window.scrollTo(scrollX, scrollY), 0);
}

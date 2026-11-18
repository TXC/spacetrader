// Both take the proportion of time elapsed, from 0 to 1.

// https://easings.net/#easeInOutCubic
export function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// https://easings.net/#easeInOutSine
export function easeInOutSine(x: number) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

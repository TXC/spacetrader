// Helpers for the lists of numbered values (tech levels, statuses, sizes ...) and their texts.

// The values of a constant object, as a type: 0 | 1 | 2 ...
export type ValueOf<T> = T[keyof T];

// How many different values a list has. A second name for the same value is not counted.
export function countOf(list: Record<string, number>): number {
  return new Set(Object.values(list)).size;
}

// Turns a table of texts into a lookup. The compiler checks that the table has a text for
// every value in K; any other number gets the `otherwise` text.
export function named<K extends number>(
  texts: Record<K, string>,
  otherwise = ''
): (value: number) => string {
  return value => texts[value as K] ?? otherwise;
}

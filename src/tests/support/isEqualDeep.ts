function symmetricDifference<T>(arr1: T[], arr2: T[]) {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  // Find elements in arr1 that are not in arr2
  const diff1 = arr1.filter(item => !set2.has(item));

  // Find elements in arr2 that are not in arr1
  const diff2 = arr2.filter(item => !set1.has(item));

  // Combine the differences
  return [...diff1, ...diff2];
}

// any: compares arbitrary values, walking whatever keys they have
export function isEqualDeep(
  objA: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  objB: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  inequalityHandler?: (s: string) => void,
  keyName?: string
): boolean {
  const MAX_DEPTH = 30; // avoid infinite loop due to circular references

  if (!keyName) {
    keyName = 'toplevel';
  }

  if (keyName.split('.').length > MAX_DEPTH) {
    //inequalityHandler("Recursed too deep: " + keyName)
    //return false
    return true;
  }

  if (objA === objB) return true; // Same reference or both null or same primitive value
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    inequalityHandler!(`[${keyName}] basic equality ${objA} ; ${objB}`);
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) {
    const differentKeys = symmetricDifference(keysA, keysB);
    inequalityHandler!(
      `[${keyName}] keys length equality objA ${keysA.length} keys ; objB ${keysB.length} keys ; differing keys: ${differentKeys.join(',')}`
    );
    return false;
  }

  for (const key of keysA) {
    if (!keysB.includes(key)) {
      inequalityHandler!(`[${keyName}] extra key: ` + key);
      return false;
    }

    if (!isEqualDeep(objA[key], objB[key], inequalityHandler, keyName + '.' + key)) {
      return false; // Recursive comparison for nested objects
    }
  }
  return true;
}

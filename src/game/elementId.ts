// Turns a label into an element id: every character that is not a letter or digit becomes "_".
export function sanitizedElementID(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, '_');
}

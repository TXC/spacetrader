// The one object the screens watch. It grows as screens move to React; for now it only
// carries the "something in the game changed" signal.
import { Store } from './Store.ts'

export class Session extends Store {}

export const session = new Session()

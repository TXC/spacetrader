import { AlertHost } from './AlertHost.tsx'
import { mountReact } from './mountReact.ts'

// Until the root of the game is React, the alert host is mounted by itself, off the page;
// each alert attaches itself to the page body.
let mounted = false
export function mountAlertHost() {
  if (mounted) return
  mounted = true
  mountReact(document.createElement('div'), <AlertHost />)
}

import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

// Draws a React screen inside an old screen, at once, and returns a function that removes
// it. Only needed while old and new screens live side by side.
export function mountReact(container: Element, element: ReactNode): () => void {
  const root = createRoot(container)
  flushSync(() => root.render(element))
  return () => flushSync(() => root.unmount())
}

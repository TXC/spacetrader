import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { registerOffline } from './offline.ts'
import { startSession } from './startSession.ts'

const session = startSession()

// Only the built game is kept for offline use; in development it would serve stale files.
if (import.meta.env.PROD) void registerOffline()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App session={session} />
  </StrictMode>,
)

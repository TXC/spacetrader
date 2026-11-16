import type { Session } from './game/session.ts'
import { AlertHost } from './ui/AlertHost.tsx'
import { Game } from './ui/Game.tsx'

function App({ session }: { session: Session }) {
  return (
    <>
      <div id="game"><Game session={session} /></div>
      <AlertHost />
    </>
  )
}

export default App

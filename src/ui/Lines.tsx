import { Fragment } from 'react'

// Text with its "\n" drawn as line breaks, as setting innerText did in the old screens.
export function Lines({ text }: { text: string }) {
  return text.split('\n').map((line, index) => (
    <Fragment key={index}>{index > 0 && <br />}{line}</Fragment>
  ))
}

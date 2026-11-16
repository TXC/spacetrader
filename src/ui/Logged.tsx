// Buttons and checkboxes that record themselves in the action log.
import type { MouseEvent, ReactNode } from 'react'
import { Utils } from '../game/Utilities.ts'
import { useLogged } from './useLogged.ts'

type ButtonProps = { id?: string, label: string, className?: string, disabled?: boolean, onPress: () => void }

// The id defaults to the label, made safe for an element id, as the old screens did.
export function LoggedButton({ id, label, className, disabled, onPress }: ButtonProps) {
  const elementId = Utils.sanitizedElementID(id ?? label)
  const onClick = useLogged(elementId, 'click', onPress)
  return <button id={elementId} className={className} disabled={disabled} onClick={onClick}>{label}</button>
}

type CheckboxProps = { id: string, checked: boolean, onToggle: (checked: boolean) => void, children: ReactNode }

export function LoggedCheckbox({ id, checked, onToggle, children }: CheckboxProps) {
  const onChange = useLogged(id, 'change', () => onToggle(!checked))
  return (
    <>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} />
      <label htmlFor={id}>{children}</label>
    </>
  )
}

type LinkProps = { id: string, className?: string, onPress: () => void, children: ReactNode }

// A link used as a button, as the old navigation and encounter buttons were.
export function LoggedLink({ id, className, onPress, children }: LinkProps) {
  const onClick = useLogged(id, 'click', (event: MouseEvent) => {
    event.preventDefault()
    onPress()
  })
  return <a id={id} className={className} href="#" onClick={onClick}>{children}</a>
}

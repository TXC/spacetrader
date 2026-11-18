// Buttons and checkboxes that record themselves in the action log.
import type { ReactNode } from 'react';
import { sanitizedElementID } from '../game/elementId.ts';
import styles from './Button.module.css';
import { useLogged } from './useLogged.ts';

type ButtonProps = {
  id?: string;
  label: string;
  disabled?: boolean;
  onPress: () => void;
  // 'main' is a screen's main action; 'danger' cannot be undone.
  kind?: 'main' | 'danger';
};

// The id defaults to the label, made safe for an element id, as the old screens did.
export function LoggedButton({ id, label, disabled, onPress, kind }: ButtonProps) {
  const elementId = sanitizedElementID(id ?? label);
  const onClick = useLogged(elementId, 'click', onPress);
  return (
    <button
      id={elementId}
      className={kind ? `${styles.button} ${styles[kind]}` : styles.button}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

type CheckboxProps = {
  id: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  children: ReactNode;
};

export function LoggedCheckbox({ id, checked, onToggle, children }: CheckboxProps) {
  const onChange = useLogged(id, 'change', () => onToggle(!checked));
  return (
    <>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} />
      <label htmlFor={id}>{children}</label>
    </>
  );
}

type LinkProps = {
  id: string;
  // True for the navigation button of the screen that is open.
  current?: boolean;
  onPress: () => void;
  children: ReactNode;
};

// A button with an icon and a text: the navigation and encounter buttons. (The name is from
// the old screens, where these were links.)
export function LoggedLink({ id, current, onPress, children }: LinkProps) {
  const onClick = useLogged(id, 'click', onPress);
  return (
    <button
      type="button"
      id={id}
      className={styles.button}
      aria-current={current ? 'page' : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

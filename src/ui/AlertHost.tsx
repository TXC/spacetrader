// Draws every open alert on top of the page.
import { useLayoutEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { AlertActionType, AlertPresentationStyle, alertStore } from '../game/alerts.ts';
import type { AlertAction, AlertViewController, SliderContent } from '../game/alerts.ts';
import { Lines } from './Lines.tsx';
import { LoggedButton } from './Logged.tsx';
import { PlunderTable } from './PlunderTable.tsx';
import { useLogged } from './useLogged.ts';
import { useStore } from './useStore.ts';

type AlertProps = { alert: AlertViewController };

function Slider({ alert, content }: AlertProps & { content: SliderContent }) {
  const onChange = useLogged(
    content.id,
    'slider|input',
    (event: ChangeEvent<HTMLInputElement>) => alert.setSliderValue(Number(event.target.value)),
    event => event.target.value
  );
  return (
    <div id={alert.elementId('alertvc-customView')}>
      <input
        id={content.id}
        aria-labelledby={alert.elementId('alertvc-title')}
        type="range"
        min={content.min}
        max={content.max}
        step="1"
        value={content.value}
        onChange={onChange}
      />
      <div>{content.value}</div>
    </div>
  );
}

function Content({ alert }: AlertProps) {
  const { content } = alert;
  if (content?.kind === 'slider') return <Slider alert={alert} content={content} />;
  if (content?.kind !== 'plunder') return null;
  return (
    <div id={alert.elementId('alertvc-customView')} className="centered-div">
      <PlunderTable plunder={content.plunder} />
    </div>
  );
}

function ActionButton({ alert, action }: AlertProps & { action: AlertAction }) {
  const destructive = action.actionType === AlertActionType.Destructive;
  return (
    <LoggedButton
      id={alert.buttonId(action.title)}
      className="alert-action-button"
      kind={destructive ? 'danger' : undefined}
      label={action.title}
      onPress={() => alert.press(action)}
    />
  );
}

// Opens the dialog as a modal for as long as it is drawn. The browser then moves the
// focus into it, keeps it there, and gives it back when the dialog goes.
function useModal() {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return ref;
}

function Alert({ alert }: AlertProps) {
  const dialog = useModal();
  const titleId = alert.elementId('alertvc-title');
  const high = alert.presentationStyle === AlertPresentationStyle.High;
  const count = alert.actions.length <= 2 ? 'two-buttons' : 'more-buttons';
  return createPortal(
    <dialog
      ref={dialog}
      id={alert.elementId('alertvc-backdrop')}
      className="alert-backdrop"
      aria-labelledby={titleId}
      // An alert needs an answer, so Escape does not close it.
      onCancel={event => event.preventDefault()}
    >
      <div className={'alert-box ' + (high ? 'alert-box-high' : 'alert-box-default')}>
        <div id={titleId} className="alert-title">
          <Lines text={alert.title} />
        </div>
        <Content alert={alert} />
        <div className={'alert-actions ' + count}>
          {alert.actions.map((action, index) => (
            <ActionButton key={index} alert={alert} action={action} />
          ))}
        </div>
      </div>
    </dialog>,
    document.body
  );
}

export function AlertHost() {
  const { open } = useStore(alertStore);
  return open.map(alert => <Alert key={alert.key} alert={alert} />);
}

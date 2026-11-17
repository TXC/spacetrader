// Draws every open alert on top of the page.
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

function Alert({ alert }: AlertProps) {
  const high = alert.presentationStyle === AlertPresentationStyle.High;
  const count = alert.actions.length <= 2 ? 'two-buttons' : 'more-buttons';
  return createPortal(
    <div id={alert.elementId('alertvc-backdrop')} className="alert-backdrop">
      <div className={'alert-box ' + (high ? 'alert-box-high' : 'alert-box-default')}>
        <div id={alert.elementId('alertvc-title')} className="alert-title">
          <Lines text={alert.title} />
        </div>
        <Content alert={alert} />
        <div className={'alert-actions ' + count}>
          {alert.actions.map((action, index) => (
            <ActionButton key={index} alert={alert} action={action} />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AlertHost() {
  const { open } = useStore(alertStore);
  return open.map(alert => <Alert key={alert.key} alert={alert} />);
}

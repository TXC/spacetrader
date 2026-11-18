// Replays a recorded game by finding each recorded element on the page and using it.
// Only the tests need this, and it works on the page, so it lives with the tests.
import { GameRand } from '../../game/GameRand.ts';
import { runtime } from '../../game/runtime.ts';
import type { Session } from '../../game/session.ts';

export class ActionLogReplay {
  declare session: Session;
  declare _gameRandSeed: number;
  declare _idLog: string[];
  declare _eventNameLog: string[];

  constructor(serializedString: string, session: Session) {
    const obj = JSON.parse(serializedString);
    this.session = session;
    this._gameRandSeed = obj.gameRandSeed;
    this._idLog = obj.idLog;
    this._eventNameLog = obj.eventNameLog;
    // The recording of escapePod_debt has one event name too many, which is never used, so
    // only a missing event name is an error.
    if (this._idLog.length > this._eventNameLog.length) {
      throw new Error('The recording has more ids than event names.');
    }
  }

  replay() {
    runtime.actionLog._gameRandSeed = this._gameRandSeed;
    runtime.actionLog.replayInProgress = true;
    runtime.gameRand = new GameRand(this._gameRandSeed);

    const len = this._idLog.length;
    for (let i = 0; i < len; i++) {
      this.replayEvent(this._idLog[i], this._eventNameLog[i]);
    }
    runtime.actionLog.replayInProgress = false;
  }

  replayEvent(elementID: string, eventName?: string) {
    eventName = eventName ? eventName : 'click';
    const replayClass = this.constructor as typeof ActionLogReplay;
    replayClass.replayEvent(elementID, eventName);
  }

  static replayEvent(elementID: string, eventName: string) {
    runtime.actionLog.replayInProgress = true; // force async to happen immediately from now on

    if (elementID === 'namedEvent') {
      const eventComponents = eventName.split(/\|/);
      const actualEventName = eventComponents[0];
      const eventContext = eventComponents[1];

      const handlerObj = runtime.actionLog._namedEvents[actualEventName];
      handlerObj.handleNamedEvent(actualEventName, eventContext);
      runtime.actionLog.logNamedEvent(actualEventName, eventContext);
    } else {
      // The replayed element can be a button, link, checkbox, slider or select.
      // The log holds strings, which the page converts when they are assigned.
      const element = document.getElementById(elementID) as unknown as {
        value: string;
        selectedIndex: string;
        checked: boolean;
        click(): void;
        dispatchEvent(e: Event): boolean;
      } | null;
      if (!element) {
        console.log(`Current replayLog: ${runtime.actionLog.serializedString()}`);
        throw new Error(`Did not find element for ${elementID}. EventName: ${eventName}`);
      }

      if (eventName.startsWith('slider')) {
        const eventComponents = eventName.split(/\|/);
        const actualEventName = eventComponents[1];
        const sliderValue = eventComponents[2];
        // React watches the value property, so set it through the browser's own setter,
        // and send an event that bubbles up to where React listens.
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
        setValue.call(element, sliderValue);
        const inputEvent = new Event(actualEventName, { bubbles: true });
        element.dispatchEvent(inputEvent);
      } else if (eventName.startsWith('select')) {
        const eventComponents = eventName.split(/\|/);
        const actualEventName = eventComponents[1];
        const selectedIndex = eventComponents[2];
        element.selectedIndex = selectedIndex;
        // The event must bubble to reach React, which listens at the top of the page.
        const inputEvent = new Event(actualEventName, { bubbles: true });
        element.dispatchEvent(inputEvent);
      } else if (eventName === 'click') {
        element.click();
      } else if (eventName === 'change') {
        // A real click toggles the box and fires its change event, for old screens and React alike.
        element.click();
      } else {
        throw new Error(`Unknown event name in a recording: ${eventName}`);
      }
    }
  }
}

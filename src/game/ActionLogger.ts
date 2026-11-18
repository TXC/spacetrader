type NamedEventHandler = { handleNamedEvent(eventName: string, eventContext: string): void };

export class ActionLogger {
  declare _gameRandSeed: number;
  declare _idLog: string[];
  declare _eventNameLog: string[];
  declare logUpdateHandler: ((log: ActionLogger) => void) | null;
  declare registerEventHandler: ((elementID: string, eventName: string) => void) | null;
  declare replayInProgress: boolean;
  declare replayInProgressQueueAsyncClosures: boolean;
  declare asyncClosureQueue: (() => void)[] | null;
  declare _namedEvents: Record<string, NamedEventHandler>;

  constructor(gameRandSeed: number) {
    this._gameRandSeed = gameRandSeed;
    this._idLog = [];
    this._eventNameLog = [];
    this.logUpdateHandler = null;
    this.registerEventHandler = null;
    this.replayInProgress = false;
    this.replayInProgressQueueAsyncClosures = false;
    this.asyncClosureQueue = null;
    // The old code uses an array as a name-to-handler dictionary.
    this._namedEvents = [] as unknown as Record<string, NamedEventHandler>;
  }

  _logUpdated() {
    if (this.logUpdateHandler) {
      this.logUpdateHandler(this);
    }
  }

  // Records one step the player took.
  record(elementID: string, eventName: string) {
    this._idLog.push(elementID);
    this._eventNameLog.push(eventName);
    this._logUpdated();
  }

  // Announces an element the player can use; the stress tests pick their next step from these.
  register(elementID: string, eventName: string) {
    this._registerEvent(elementID, eventName);
  }

  _registerEvent(elementID: string, eventName: string) {
    if (this.registerEventHandler) {
      this.registerEventHandler(elementID, eventName);
    }
  }

  performAsync(handler: () => void, delay: number) {
    if (this.replayInProgressQueueAsyncClosures) {
      if (!this.asyncClosureQueue) {
        this.asyncClosureQueue = [];
      }

      this.asyncClosureQueue.push(handler);
    } else if (this.replayInProgress) {
      handler();
    } else {
      setTimeout(() => {
        handler();
      }, delay);
    }
  }

  registerNamedEventListener(handlerObject: NamedEventHandler, eventName: string) {
    this._namedEvents[eventName] = handlerObject;
  }

  // Forgets a listener, unless another has taken its name since.
  unregisterNamedEventListener(handlerObject: NamedEventHandler, eventName: string) {
    if (this._namedEvents[eventName] === handlerObject) {
      delete this._namedEvents[eventName];
    }
  }

  logNamedEvent(eventName: string, eventContext: string | number) {
    // this._registerEvent(...) - not implemented

    this._idLog.push('namedEvent');
    this._eventNameLog.push(eventName + '|' + eventContext);
    this._logUpdated();
  }

  serializedString() {
    return JSON.stringify({
      idLog: this._idLog,
      eventNameLog: this._eventNameLog,
      gameRandSeed: this._gameRandSeed,
    });
  }
}

// @ts-nocheck
import { Utils } from '../game/Utilities.ts'
import { runtime } from '../game/runtime.ts'

export const AlertActionType = {
  Default: 0,
  Destructive: 1,
  Cancel: 2,
};

export class AlertAction {
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any -- old untyped code: lets typed files read its properties
  constructor(title, actionType, handler) {
    this.title = title
    this.actionType = actionType
    this.handler = handler
  }
}

export const AlertPresentationStyle = {
  Default: 0,
  High: 1,
};

export class AlertViewController {
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any -- old untyped code: lets typed files read its properties
  constructor(alertStr, alertID?) { // `?` is type-only: typed rules create alerts without an id
    this._alertTitle = alertStr
    this._actions = []
    this._alertID = alertID ? "-" + alertID : ""
    this.completionHandler = null
    this.presentationStyle = AlertPresentationStyle.Default
  }

  static presentAlertWithDismiss(alertStr) {
    let aC = new AlertViewController(alertStr)
    aC.addAction("Dismiss", AlertActionType.Default, null)
    aC.presentView()
  }

  addAction(title, actionType, handler) {
    this._actions.push(new AlertAction(title, actionType, handler))
  }

  presentView() {
    // Create the backdrop (overlay)
    const backdrop = document.createElement('div');
    backdrop.id = "alertvc-backdrop" + this._alertID
    backdrop.classList.add('alert-backdrop');

    // Create the alert box
    const alertBox = document.createElement('div');
    alertBox.classList.add('alert-box');
    if (this.presentationStyle === AlertPresentationStyle.Default) {
      alertBox.classList.add('alert-box-default');
    } else if (this.presentationStyle === AlertPresentationStyle.High) {
      alertBox.classList.add('alert-box-high')
    }

    // Create the title element
    const titleElement = document.createElement('div');
    titleElement.classList.add('alert-title');
    titleElement.id = "alertvc-title" + this._alertID
    titleElement.innerText = this._alertTitle;

    // Create the actions container
    const actionsContainer = document.createElement('div');
    actionsContainer.classList.add('alert-actions');

    // Add a class for two or more buttons
    if (this._actions.length <= 2) {
      actionsContainer.classList.add('two-buttons');
    } else {
      actionsContainer.classList.add('more-buttons');
    }

    // Create each action button
    this._actions.forEach(action => {
      const button = document.createElement('button');
      button.classList.add('alert-action-button');
      button.innerText = action.title;
      button.id = Utils.sanitizedElementID("alertButton_" + this._alertID + button.innerText)

      if (action.actionType === AlertActionType.Destructive) {
        button.classList.add('destructive');
      }

      runtime.actionLog.registerButtonEventListener(button, 'click', () => {
        if (action.handler) {
          action.handler(); // Call the handler function
        }
        document.body.removeChild(backdrop); // Remove the alert

        if (this.completionHandler) {
          this.completionHandler()
        }
      });
      actionsContainer.appendChild(button);
    });

    // Append title and actions to the alert box
    alertBox.appendChild(titleElement);

    if (this.customViewHandler) {
      const customViewDiv = document.createElement('div')
      customViewDiv.id = "alertvc-customView" + this._alertID
      alertBox.appendChild(customViewDiv)
      this.customViewHandler(customViewDiv)
    }

    alertBox.appendChild(actionsContainer);

    // Append the alert box to the backdrop
    backdrop.appendChild(alertBox);

    // Append the backdrop to the body
    document.body.appendChild(backdrop);
  }

  static clearAlerts() {
    const els = document.getElementsByClassName("alert-backdrop")
    if (!els) { return }

    for (let i = 0; i < els.length; ++i) {
      const el = els[i]
      if (el) {
        document.body.removeChild(el)
      }
    }
  }

  static currentAlertTitle() {
    const els = document.getElementsByClassName("alert-title")
    if (!els || els.length <= 0) { return }
    return els[0].innerText
  }
}

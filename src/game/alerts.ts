// Alerts as data. The rules open alerts and their buttons carry the game forward; the
// page only draws what is in alertStore.open.
import { sanitizedElementID } from './elementId.ts'
import { Store } from './Store.ts'

export const AlertActionType = {
  Default: 0,
  Destructive: 1,
  Cancel: 2,
} as const
export type AlertActionType = (typeof AlertActionType)[keyof typeof AlertActionType]

export const AlertPresentationStyle = {
  Default: 0,
  High: 1,
} as const
export type AlertPresentationStyle = (typeof AlertPresentationStyle)[keyof typeof AlertPresentationStyle]

type Handler = (() => void) | null

// Extra content between the title and the buttons.
export type AlertContent = { kind: 'slider', id: string, min: number, max: number, value: number }

export class AlertAction {
  declare title: string
  declare actionType: AlertActionType
  declare handler: Handler

  constructor(title: string, actionType: AlertActionType, handler: Handler) {
    this.title = title
    this.actionType = actionType
    this.handler = handler
  }
}

class AlertStore extends Store {
  open: AlertViewController[] = []
  private nextKey = 0

  add(alert: AlertViewController) {
    alert.key = this.nextKey++
    this.open.push(alert)
    this.changed()
  }

  remove(alert: AlertViewController) {
    this.open = this.open.filter((other) => other !== alert)
    this.changed()
  }

  clear() {
    this.open = []
    this.changed()
  }
}

export const alertStore = new AlertStore()

// The name is the old screen class's; the rules still create alerts through it.
export class AlertViewController {
  key = 0
  actions: AlertAction[] = []
  completionHandler: Handler = null
  presentationStyle: AlertPresentationStyle = AlertPresentationStyle.Default
  content: AlertContent | null = null
  // Still used by the old plunder screen to fill the content area by hand.
  customViewHandler: ((div: HTMLElement) => void) | null = null
  title: string
  private suffix: string

  constructor(alertStr: string, alertID?: string) {
    this.title = alertStr
    this.suffix = alertID ? '-' + alertID : ''
  }

  static presentAlertWithDismiss(alertStr: string) {
    const alert = new AlertViewController(alertStr)
    alert.addAction('Dismiss', AlertActionType.Default, null)
    alert.presentView()
  }

  // The old code skipped every second open alert here by accident. This closes them all.
  static clearAlerts() {
    alertStore.clear()
  }

  // The title of the oldest open alert, as the page shows it first.
  static currentAlertTitle(): string | undefined {
    return alertStore.open[0]?.title
  }

  addAction(title: string, actionType: AlertActionType, handler: Handler) {
    this.actions.push(new AlertAction(title, actionType, handler))
  }

  presentView() {
    alertStore.add(this)
  }

  // What a click on a button does, in the old order: handler, close, completion step.
  press(action: AlertAction) {
    action.handler?.()
    alertStore.remove(this)
    this.completionHandler?.()
  }

  setSliderValue(value: number) {
    if (this.content) this.content.value = value
    alertStore.changed()
  }

  // "alertvc-title" -> "alertvc-title-<alert id>"
  elementId(base: string): string {
    return base + this.suffix
  }

  buttonId(title: string): string {
    return sanitizedElementID('alertButton_' + this.suffix + title)
  }
}
